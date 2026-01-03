import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
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

        const myLocations = await ctx.db
            .query("locations")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        const myLocationNames = new Set(myLocations.map((l) => l.name));

        const myMatches = await ctx.db
            .query("matches")
            .withIndex("by_userId1", (q) => q.eq("userId1", currentUser._id))
            .collect();

        const myRejections = await ctx.db
            .query("rejections")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        const myBlocks = await ctx.db
            .query("blocks")
            .withIndex("by_blockerId", (q) => q.eq("blockerId", currentUser._id))
            .collect();

        const myReports = await ctx.db
            .query("reports")
            .filter((q) => q.eq(q.field("reporterId"), currentUser._id))
            .collect();

        const excludedIds = new Set([
            currentUser._id, 
            ...myMatches.map((m) => m.userId2),
            ...myRejections.map((r) => r.rejectedUserId),
            ...myBlocks.map((b) => b.blockedId),
            ...myReports.map((r) => r.reportedId),
        ]);

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

        function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
            const R = 6371; 
            const dLat = deg2rad(lat2 - lat1);
            const dLon = deg2rad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c; 
            return d;
        }

        function deg2rad(deg: number) {
            return deg * (Math.PI / 180);
        }

        const minAge = currentUser.datingPreferences?.ageRange?.[0] ?? 18;
        const maxAge = currentUser.datingPreferences?.ageRange?.[1] ?? 100;
        const maxDist = currentUser.datingPreferences?.maxDistanceKm ?? 50;
        const prefReligion = currentUser.datingPreferences?.religion ?? [];

        let myLat = 0;
        let myLon = 0;
        if (myLocations.length > 0) {
            const sorted = myLocations.sort((a, b) => b.savedAt - a.savedAt);
            myLat = sorted[0].lat;
            myLon = sorted[0].lng;
        }

        const scoredCandidates = await Promise.all(
            candidates
                .filter((user) => !excludedIds.has(user._id) && user.isVisible !== false)
                .map(async (user) => {
                    const age = user.age ?? 18;
                    if (age < minAge || age > maxAge) return null;

                    const userLocations = await ctx.db.query("locations").withIndex("by_userId", (q) => q.eq("userId", user._id)).collect();

                    const sharedLocations = userLocations.filter((l) => myLocationNames.has(l.name)).map((l) => l.name);
                    const sharedCount = sharedLocations.length;

                    let tier = 3; 

                    if (sharedCount >= 3) {
                        tier = 1;
                    }
                    else {
                        if (userLocations.length > 0 && myLocations.length > 0) {
                            const uLoc = userLocations.sort((a, b) => b.savedAt - a.savedAt)[0];
                            const dist = getDistanceFromLatLonInKm(myLat, myLon, uLoc.lat, uLoc.lng);

                            let passesDistance = dist <= maxDist;

                            let passesReligion = true;
                            if (prefReligion.length > 0 && user.religion) {
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

        const finalResults = scoredCandidates.filter((c): c is NonNullable<typeof c> => c !== null);

        finalResults.sort((a, b) => {
            if (a.tier !== b.tier) {
                return a.tier - b.tier; 
            }
            if (a.tier === 1) {
                return b.sharedLocations.length - a.sharedLocations.length; 
            }
            return 0;
        });

        return finalResults;
    },
});

export const likeProfile = mutation({
    args: { targetId: v.id("profiles") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db.query("profiles").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
        if (!currentUser) throw new Error("Profile not found");

        const targetProfile = await ctx.db.get(args.targetId);
        if (!targetProfile) throw new Error("Target profile not found");

        const userId1 = currentUser._id;
        const userId2 = args.targetId;
        const reverseMatch = await ctx.db.query("matches").withIndex("by_users", (q) => q.eq("userId1", userId2).eq("userId2", userId1)).filter((q) => q.eq(q.field("status"), "pending")).unique();

        if (reverseMatch) {
            await ctx.db.patch(reverseMatch._id, { status: "accepted", updatedAt: Date.now() });

            await ctx.db.insert("matches", {
                userId1,
                userId2,
                status: "accepted",
                updatedAt: Date.now(),
                createdAt: Date.now(),
            });

            await ctx.db.insert("conversations", {
                matchId: reverseMatch._id,
                user1: userId1,
                user2: userId2,
                lastMessageAt: Date.now(),
            });

            await ctx.scheduler.runAfter(0, internal.notifications.sendPushHelper, {
                targetProfileId: args.targetId,
                title: "It's a Match! 🎉",
                body: `You matched with ${currentUser.name}!`,
                data: { type: "match", matchId: reverseMatch._id },
            });

            return { status: "matched" };
        } else {
            const existing = await ctx.db.query("matches").withIndex("by_users", (q) => q.eq("userId1", userId1).eq("userId2", userId2)).unique();

            if (!existing) {
                await ctx.db.insert("matches", {
                    userId1,
                    userId2,
                    status: "pending",
                    updatedAt: Date.now(),
                    createdAt: Date.now(),
                });

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

export const getMutualMatches = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db.query("profiles").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
        if (!currentUser) return [];

        const matches = await ctx.db.query("matches").withIndex("by_userId1", (q) => q.eq("userId1", currentUser._id)).filter((q) => q.eq(q.field("status"), "accepted")).collect();

        const results = await Promise.all(
            matches.map(async (m) => {
                const profile = await ctx.db.get(m.userId2 as Id<"profiles">);
                if (!profile) return null;
                return { ...profile, matchId: m._id };
            })
        );
        return results.filter((p) => p !== null);
    },
});

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

        const pending = await ctx.db
            .query("matches")
            .withIndex("by_userId2", (q) => q.eq("userId2", currentUser._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        const results = await Promise.all(
            pending.map(async (m) => {
                const profile = await ctx.db.get(m.userId1 as Id<"profiles">);
                if (!profile) return null;
                return { ...profile, matchId: m._id };
            })
        );
        return results.filter((p) => p !== null);
    },
});

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

        const myLocations = await ctx.db
            .query("locations")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();
        const myLocationNames = new Set(myLocations.map((l) => l.name));

        const targetLocations = await ctx.db
            .query("locations")
            .withIndex("by_userId", (q) => q.eq("userId", targetProfile._id))
            .collect();

        const sharedLocations = targetLocations
            .filter((l) => myLocationNames.has(l.name))
            .map((l) => l.name);

        return {
            ...targetProfile,
            sharedLocations,
        };
    },
});

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
 
        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        if (match.userId1 !== currentUser._id && match.userId2 !== currentUser._id) {
            throw new Error("Unauthorized");
        }

        const otherUserId = match.userId1 === currentUser._id ? match.userId2 : match.userId1;

        const otherMatch = await ctx.db
            .query("matches")
            .withIndex("by_users", (q) => q.eq("userId1", otherUserId).eq("userId2", currentUser._id))
            .unique();

        let conversation = await ctx.db
            .query("conversations")
            .withIndex("by_matchId", (q) => q.eq("matchId", match._id))
            .unique();

        if (!conversation && otherMatch) {
            conversation = await ctx.db
                .query("conversations")
                .withIndex("by_matchId", (q) => q.eq("matchId", otherMatch._id))
                .unique();
        }

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

        const existingBlock = await ctx.db
            .query("blocks")
            .withIndex("by_block_pair", (q) => q.eq("blockerId", currentUser._id).eq("blockedId", args.targetId))
            .unique();

        if (existingBlock) {
            return;
        }

        await ctx.db.insert("blocks", {
            blockerId: currentUser._id,
            blockedId: args.targetId,
            createdAt: Date.now(),
        });

        const match1 = await ctx.db.query("matches").withIndex("by_users", q => q.eq("userId1", currentUser._id).eq("userId2", args.targetId)).unique();
        const match2 = await ctx.db.query("matches").withIndex("by_users", q => q.eq("userId1", args.targetId).eq("userId2", currentUser._id)).unique();

        const matchIds = [];
        if (match1) matchIds.push(match1._id);
        if (match2) matchIds.push(match2._id);

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

        const rejections = await ctx.db
            .query("rejections")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        if (rejections.length === 0) {
            return null;
        }

        const lastRejection = rejections.sort((a, b) => b.createdAt - a.createdAt)[0];

        await ctx.db.delete(lastRejection._id);

        return lastRejection.rejectedUserId;
    },
});
