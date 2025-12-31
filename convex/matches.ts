import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

export const getPotentialMatches = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) {
            return [];
        }

        // 1. Get User's Saved Locations (for overlap calculation)
        const myLocations = await ctx.db
            .query("locations")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        const myLocationNames = new Set(myLocations.map((l) => l.name));

        // 2. Get Exclusions (People already engaged with)
        const myMatches = await ctx.db
            .query("matches")
            .withIndex("by_userId1", (q) => q.eq("userId1", currentUser._id))
            .collect();

        // - Rejections
        const myRejections = await ctx.db
            .query("rejections")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        // - Blocks 
        const myBlocks = await ctx.db
            .query("blocks")
            .withIndex("by_blockerId", (q) => q.eq("blockerId", currentUser._id))
            .collect();

        // - Reports
        const myReports = await ctx.db
            .query("reports")
            .filter((q) => q.eq(q.field("reporterId"), currentUser._id))
            .collect();

        const excludedIds = new Set([
            currentUser._id, // Exclude self
            ...myMatches.map((m) => m.userId2),
            ...myRejections.map((r) => r.rejectedUserId),
            ...myBlocks.map((b) => b.blockedId),
            ...myReports.map((r) => r.reportedId),
        ]);

        // 3. Fetch Candidates (Gender Filter)
        let candidates;
        const preference = currentUser.datingPreferences?.interestedIn;

        if (preference && preference !== "Everyone") {
            candidates = await ctx.db
                .query("profiles")
                .withIndex("by_gender", (q) => q.eq("gender", preference))
                .collect();
        } else {
            candidates = await ctx.db.query("profiles").collect();
        }

        // Helper: Haversine Distance
        function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
            const R = 6371; // Radius of the earth in km
            const dLat = deg2rad(lat2 - lat1);
            const dLon = deg2rad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c; // Distance in km
            return d;
        }

        function deg2rad(deg: number) {
            return deg * (Math.PI / 180);
        }

        // Preferences
        const minAge = currentUser.datingPreferences?.ageRange?.[0] ?? 18;
        const maxAge = currentUser.datingPreferences?.ageRange?.[1] ?? 100;
        const maxDist = currentUser.datingPreferences?.maxDistanceKm ?? 50; // Default 50km
        const prefReligion = currentUser.datingPreferences?.religion ?? [];

        // Current User Lat/Lon (Use the most recently updated location or default to null)
        // Note: Ideally, 'profiles' should store a 'lastLocation' for quick access. 
        // For now, we'll try to use the most recent saved location, or if unavailable, we can't calculate distance properly.
        // Optimization: In a real app, you'd store lat/lon on the profile.
        // Let's assume we take the first location from myLocations for "current location" 
        // OR better: The user might strictly want to match people near WHERE THEY ARE. 
        // Since we don't have live GPS on profile, let's use the most recent location in `locations`.
        // A better approach for "Discovery" is usually "People near me RIGHT NOW". 
        // But since we are "Locations Visited" based, let's use the most recent one.

        let myLat = 0;
        let myLon = 0;
        if (myLocations.length > 0) {
            const sorted = myLocations.sort((a, b) => b.savedAt - a.savedAt);
            myLat = sorted[0].lat;
            myLon = sorted[0].lng;
        }

        // 4. Score and Sort
        const scoredCandidates = await Promise.all(
            candidates
                .filter((user) => !excludedIds.has(user._id) && user.isVisible !== false) // Exclusions & Visibility
                .map(async (user) => {
                    // UNIVERSAL FILTER 1: Age
                    // If age is missing, assume 18.
                    const age = user.age ?? 18;
                    if (age < minAge || age > maxAge) return null;

                    // fetch candidate locations
                    const userLocations = await ctx.db.query("locations").withIndex("by_userId", (q) => q.eq("userId", user._id)).collect();

                    // Calculate Shared Locations
                    const sharedLocations = userLocations.filter((l) => myLocationNames.has(l.name)).map((l) => l.name);
                    const sharedCount = sharedLocations.length;

                    // Determine Tier
                    let tier = 3; // 3 = Filtered Out

                    // TIER 1: CROSSING PATHS (High Intent / Serendipity)
                    if (sharedCount >= 3) {
                        tier = 1;
                    }
                    // TIER 2: DISCOVERY (Distance + Other Prefs)
                    else {
                        // Check Distance
                        // If they have NO locations, we can't calculate distance -> Skip 
                        // (Unless we allow "Globals"?) - For now, skip.
                        if (userLocations.length > 0 && myLocations.length > 0) {
                            // Use their most recent location
                            const uLoc = userLocations.sort((a, b) => b.savedAt - a.savedAt)[0];
                            const dist = getDistanceFromLatLonInKm(myLat, myLon, uLoc.lat, uLoc.lng);

                            let passesDistance = dist <= maxDist;

                            // Check Religion (if preference set)
                            let passesReligion = true;
                            if (prefReligion.length > 0 && user.religion) {
                                // If user has religion set, check if it's in our allowed list
                                // If our list is empty, we don't care.
                                if (!prefReligion.includes(user.religion)) {
                                    passesReligion = false;
                                }
                            }

                            if (passesDistance && passesReligion) {
                                tier = 2;
                            }
                        }
                    }

                    if (tier === 3) return null;

                    return { ...user, sharedLocations, tier };
                })
        );

        // Filter nulls and Sort
        const finalResults = scoredCandidates.filter((c): c is NonNullable<typeof c> => c !== null);

        // Sort: Tier 1 -> Tier 2
        // Inside Tier 1: Most Shared Locations -> Descending
        // Inside Tier 2: (Implicitly random or by creation? Let's assume random for now, or we could sort by distance if we passed it up)
        finalResults.sort((a, b) => {
            if (a.tier !== b.tier) {
                return a.tier - b.tier; // 1 before 2
            }
            if (a.tier === 1) {
                return b.sharedLocations.length - a.sharedLocations.length; // More shared = higher
            }
            return 0;
        });

        return finalResults;
    },
});

// MUTATIONS
export const likeProfile = mutation({
    args: { targetId: v.id("profiles") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db.query("profiles").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
        if (!currentUser) throw new Error("Profile not found");

        // Validate target exists
        const targetProfile = await ctx.db.get(args.targetId);
        if (!targetProfile) throw new Error("Target profile not found");

        const userId1 = currentUser._id;
        const userId2 = args.targetId;
        // 1. Check if they already liked me (Reverse Pending)
        const reverseMatch = await ctx.db.query("matches").withIndex("by_users", (q) => q.eq("userId1", userId2).eq("userId2", userId1)).filter((q) => q.eq(q.field("status"), "pending")).unique();

        if (reverseMatch) {
            // It's a Match Update their record to accepted ->
            await ctx.db.patch(reverseMatch._id, { status: "accepted", updatedAt: Date.now() });

            // Create my record as accepted ->
            await ctx.db.insert("matches", {
                userId1,
                userId2,
                status: "accepted",
                updatedAt: Date.now(),
                createdAt: Date.now(),
            });

            // Create Conversation
            await ctx.db.insert("conversations", {
                matchId: reverseMatch._id,
                user1: userId1,
                user2: userId2,
                lastMessageAt: Date.now(),
            });

            // Notify the other user (reverseMatch.userId1 is the one who liked first, so userId2 in this context)
            // Wait, reverseMatch was: I am userId1 now. They were userId1 in reverseMatch.
            // So reverseMatch.userId1 is the TARGET person.
            // Let's rely on args.targetId.
            await ctx.scheduler.runAfter(0, internal.notifications.sendPushHelper, {
                targetProfileId: args.targetId,
                title: "It's a Match! 🎉",
                body: `You matched with ${currentUser.name}!`,
                data: { type: "match", matchId: reverseMatch._id },
            });

            return { status: "matched" };
        } else {
            // Just a like (Pending) - Check if I already liked them to prevent duplicates
            const existing = await ctx.db.query("matches").withIndex("by_users", (q) => q.eq("userId1", userId1).eq("userId2", userId2)).unique();

            if (!existing) {
                await ctx.db.insert("matches", {
                    userId1,
                    userId2,
                    status: "pending",
                    updatedAt: Date.now(),
                    createdAt: Date.now(),
                });

                // Notify Target of a Like
                await ctx.scheduler.runAfter(0, internal.notifications.sendPushHelper, {
                    targetProfileId: args.targetId,
                    title: "New Like 💖",
                    body: "Someone liked your profile!",
                    data: { type: "like" },
                });
            }
            return { status: "pending" };
        }
    },
});

export const passProfile = mutation({
    args: { targetId: v.id("profiles") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("Profile not found");

        // Record Rejection
        const existingRejection = await ctx.db.query("rejections").withIndex("by_userId", (q) => q.eq("userId", currentUser._id)).filter((q) => q.eq(q.field("rejectedUserId"), args.targetId)).unique();

        if (!existingRejection) {
            await ctx.db.insert("rejections", {
                userId: currentUser._id,
                rejectedUserId: args.targetId,
                createdAt: Date.now(),
            });
        }

        const reverseMatch = await ctx.db
            .query("matches")
            .withIndex("by_users", (q) => q.eq("userId1", args.targetId).eq("userId2", currentUser._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .unique();

        if (reverseMatch) {
            await ctx.db.patch(reverseMatch._id, { status: "rejected", updatedAt: Date.now() });
        }
    },
});

// QUERIES (Chats)
// 1. Get confirmed matches (for the "Matches" list)
export const getMutualMatches = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db.query("profiles").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
        if (!currentUser) return [];

        // Find all 'accepted' matches where I am userId1
        const matches = await ctx.db.query("matches").withIndex("by_userId1", (q) => q.eq("userId1", currentUser._id)).filter((q) => q.eq(q.field("status"), "accepted")).collect();

        // Fetch the profiles of the matched users
        const results = await Promise.all(
            matches.map(async (m) => {
                const profile = await ctx.db.get(m.userId2 as any);
                if (!profile) return null;
                return { ...profile, matchId: m._id };
            })
        );
        return results.filter((p) => p !== null);
    },
});

// 2. Get people who liked me (for "Liked You" list)
export const getPendingLikers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) return [];

        // Find matches where I am userId2 AND status is pending
        const pending = await ctx.db
            .query("matches")
            .withIndex("by_userId2", (q) => q.eq("userId2", currentUser._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        const results = await Promise.all(
            pending.map(async (m) => {
                const profile = await ctx.db.get(m.userId1 as any);
                if (!profile) return null;
                return { ...profile, matchId: m._id };
            })
        );
        return results.filter((p) => p !== null);
    },
});

// 3. Get specific profile with match details (for Profile View)
export const getProfileWithDetails = query({
    args: { profileId: v.id("profiles") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("Profile not found");

        const targetProfile = await ctx.db.get(args.profileId);
        if (!targetProfile) return null;

        // Calculate Shared Locations
        // 1. My Locations
        const myLocations = await ctx.db
            .query("locations")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();
        const myLocationNames = new Set(myLocations.map((l) => l.name));

        // 2. Target Locations
        const targetLocations = await ctx.db
            .query("locations")
            .withIndex("by_userId", (q) => q.eq("userId", targetProfile._id))
            .collect();

        // 3. Overlap
        const sharedLocations = targetLocations
            .filter((l) => myLocationNames.has(l.name))
            .map((l) => l.name);

        return {
            ...targetProfile,
            sharedLocations,
        };
    },
});

//SAFETY MUTATIONS
export const unmatch = mutation({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("Profile not found");

        // Find the match 
        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        if (match.userId1 !== currentUser._id && match.userId2 !== currentUser._id) {
            throw new Error("Unauthorized");
        }

        // Delete the Match records
        const otherUserId = match.userId1 === currentUser._id ? match.userId2 : match.userId1;

        // Find the other match record
        const otherMatch = await ctx.db
            .query("matches")
            .withIndex("by_users", (q) => q.eq("userId1", otherUserId).eq("userId2", currentUser._id))
            .unique();

        // Find associated conversation
        let conversation = await ctx.db
            .query("conversations")
            .withIndex("by_matchId", (q) => q.eq("matchId", match._id))
            .unique();

        // If not found, try otherMatch._id
        if (!conversation && otherMatch) {
            conversation = await ctx.db
                .query("conversations")
                .withIndex("by_matchId", (q) => q.eq("matchId", otherMatch._id))
                .unique();
        }

        // 3. Delete Conversation & Messages
        if (conversation) {
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
                .collect();

            for (const msg of messages) {
                await ctx.db.delete(msg._id);
            }
            await ctx.db.delete(conversation._id);
        }

        if (otherMatch) await ctx.db.delete(otherMatch._id);
        await ctx.db.delete(match._id);
    },
});

export const block = mutation({
    args: { targetId: v.id("profiles") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("Profile not found");

        // Check for existing block 
        const existingBlock = await ctx.db
            .query("blocks")
            .withIndex("by_block_pair", (q) => q.eq("blockerId", currentUser._id).eq("blockedId", args.targetId))
            .unique();

        if (existingBlock) {
            return;
        }

        // Add to Blocks table
        await ctx.db.insert("blocks", {
            blockerId: currentUser._id,
            blockedId: args.targetId,
            createdAt: Date.now(),
        });

        // Perform Unmatch logic
        const match1 = await ctx.db.query("matches").withIndex("by_users", q => q.eq("userId1", currentUser._id).eq("userId2", args.targetId)).unique();
        const match2 = await ctx.db.query("matches").withIndex("by_users", q => q.eq("userId1", args.targetId).eq("userId2", currentUser._id)).unique();

        const matchIds = [];
        if (match1) matchIds.push(match1._id);
        if (match2) matchIds.push(match2._id);

        // Find conversation using ANY of the match IDs
        let conversation = null;
        for (const mId of matchIds) {
            const c = await ctx.db.query("conversations").withIndex("by_matchId", q => q.eq("matchId", mId)).unique();
            if (c) {
                conversation = c;
                break;
            }
        }

        if (conversation) {
            const messages = await ctx.db.query("messages").withIndex("by_conversationId", q => q.eq("conversationId", conversation._id)).collect();
            for (const msg of messages) await ctx.db.delete(msg._id);
            await ctx.db.delete(conversation._id);
        }

        if (match1) await ctx.db.delete(match1._id);
        if (match2) await ctx.db.delete(match2._id);
    },
});

export const report = mutation({
    args: {
        targetId: v.id("profiles"),
        reason: v.string(),
        description: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("Profile not found");

        await ctx.db.insert("reports", {
            reporterId: currentUser._id,
            reportedId: args.targetId,
            reason: args.reason,
            description: args.description,
            createdAt: Date.now(),
        });

        const alreadyBlocked = await ctx.db
            .query("blocks")
            .withIndex("by_block_pair", q => q.eq("blockerId", currentUser._id).eq("blockedId", args.targetId))
            .unique();

        if (!alreadyBlocked) {
            await ctx.db.insert("blocks", {
                blockerId: currentUser._id,
                blockedId: args.targetId,
                createdAt: Date.now(),
            });

            // Delete matches/conversations (Unmatch)
            const match1 = await ctx.db.query("matches").withIndex("by_users", q => q.eq("userId1", currentUser._id).eq("userId2", args.targetId)).unique();
            const match2 = await ctx.db.query("matches").withIndex("by_users", q => q.eq("userId1", args.targetId).eq("userId2", currentUser._id)).unique();
            const matchId = match1?._id || match2?._id;
            if (matchId) {
                const conversation = await ctx.db.query("conversations").withIndex("by_matchId", q => q.eq("matchId", matchId)).unique();
                if (conversation) {
                    const messages = await ctx.db.query("messages").withIndex("by_conversationId", q => q.eq("conversationId", conversation._id)).collect();
                    for (const msg of messages) await ctx.db.delete(msg._id);
                    await ctx.db.delete(conversation._id);
                }
            }
            if (match1) await ctx.db.delete(match1._id);
            if (match2) await ctx.db.delete(match2._id);
        }
    }
});

export const rewindLastRejection = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("Profile not found");

        // Find the most recent rejection
        const rejections = await ctx.db
            .query("rejections")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        if (rejections.length === 0) {
            return null; // Nothing to rewind
        }

        // Sort by createdAt descending to get the most recent
        const lastRejection = rejections.sort((a, b) => b.createdAt - a.createdAt)[0];

        // Delete the rejection
        await ctx.db.delete(lastRejection._id);

        return lastRejection.rejectedUserId;
    },
});
