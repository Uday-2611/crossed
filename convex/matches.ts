import { v } from "convex/values";
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
            throw new Error("Profile not found");
        }

        // 1. Get User's Saved Locations (for overlap calculation)
        const myLocations = await ctx.db
            .query("locations")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        const myLocationNames = new Set(myLocations.map((l) => l.name));

        // 2. Get Exclusions (People already engaged with)
        // - Matches (I am userId1)
        const myMatches = await ctx.db
            .query("matches")
            .withIndex("by_userId1", (q) => q.eq("userId1", currentUser._id))
            .collect();

        // - Rejections (I am userId)
        const myRejections = await ctx.db
            .query("rejections")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .collect();

        // - Blocks (I am blocker)
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

        // 3. Fetch Candidates
        let candidates;
        const preference = currentUser.datingPreferences?.interestedIn;

        if (preference && preference !== "Everyone") {
            candidates = await ctx.db
                .query("profiles")
                .withIndex("by_gender", (q) => q.eq("gender", preference))
                .collect();
        } else {
            candidates = await ctx.db
                .query("profiles")
                .collect();
        }

        // 4. Score and Sort
        const scoredCandidates = await Promise.all(
            candidates
                .filter((user) => !excludedIds.has(user._id)) // Filter exclusions
                .map(async (user) => {
                    // fetch candidate locations
                    const userLocations = await ctx.db
                        .query("locations")
                        .withIndex("by_userId", (q) => q.eq("userId", user._id))
                        .collect();

                    // Calculate Overlap
                    const sharedLocations = userLocations
                        .filter((l) => myLocationNames.has(l.name))
                        .map((l) => l.name);

                    // Determine Tier
                    let tier = 3; // Bronze
                    if (sharedLocations.length >= 3) {
                        tier = 1; // Gold
                    } else if (sharedLocations.length >= 1) {
                        tier = 2; // Silver
                    }

                    return {
                        ...user,
                        sharedLocations,
                        tier,
                    };
                })
        );

        // Sort: Tier 1 -> Tier 2 -> Tier 3
        scoredCandidates.sort((a, b) => a.tier - b.tier);

        return scoredCandidates;
    },
});

/* -------------------------------------------------------------------------- */
/*                                 MUTATIONS                                  */
/* -------------------------------------------------------------------------- */

export const likeProfile = mutation({
    args: { targetId: v.id("profiles") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("Profile not found");

        // Validate target exists
        const targetProfile = await ctx.db.get(args.targetId);
        if (!targetProfile) throw new Error("Target profile not found");

        const userId1 = currentUser._id;
        const userId2 = args.targetId;
        // 1. Check if they already liked me (Reverse Pending)
        const reverseMatch = await ctx.db
            .query("matches")
            .withIndex("by_users", (q) => q.eq("userId1", userId2).eq("userId2", userId1))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .unique();

        if (reverseMatch) {
            // IT'S A MATCH!
            // Update their record to accepted
            await ctx.db.patch(reverseMatch._id, { status: "accepted", updatedAt: Date.now() });

            // Create my record as accepted
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

            return { status: "matched" };
        } else {
            // Just a like (Pending)
            // Check if I already liked them to prevent dupes (idempotency)
            const existing = await ctx.db
                .query("matches")
                .withIndex("by_users", (q) => q.eq("userId1", userId1).eq("userId2", userId2))
                .unique();

            if (!existing) {
                await ctx.db.insert("matches", {
                    userId1,
                    userId2,
                    status: "pending", // Waiting for them to like back
                    updatedAt: Date.now(),
                    createdAt: Date.now(),
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

        // Record Rejection (idempotent)
        const existingRejection = await ctx.db
            .query("rejections")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .filter((q) => q.eq(q.field("rejectedUserId"), args.targetId))
            .unique();

        if (!existingRejection) {
            await ctx.db.insert("rejections", {
                userId: currentUser._id,
                rejectedUserId: args.targetId,
                createdAt: Date.now(),
            });
        }

        // Check if they had liked me (status: pending). If so, we can mark it rejected or just leave it.
        // User requested: "if a user crosses a profile from liked you it should be removed from liked you"
        // So we should find their pending like and reject it so it drops from the list.
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

/* -------------------------------------------------------------------------- */
/*                               QUERIES (Chats)                              */
/* -------------------------------------------------------------------------- */

// 1. Get confirmed matches (for the "Matches" list)
export const getMutualMatches = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) return [];

        // Find all 'accepted' matches where I am userId1
        const matches = await ctx.db
            .query("matches")
            .withIndex("by_userId1", (q) => q.eq("userId1", currentUser._id))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .collect();

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

// End of matches.ts

/* -------------------------------------------------------------------------- */
/*                              SAFETY MUTATIONS                              */
/* -------------------------------------------------------------------------- */

export const unmatch = mutation({
    args: { matchId: v.id("matches") }, // matchId comes from the conversation or match object
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("Profile not found");

        // 1. Find the match (could be under userId1 or userId2)
        // We expect the frontend to pass the matchId, but we must verify ownership
        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        if (match.userId1 !== currentUser._id && match.userId2 !== currentUser._id) {
            throw new Error("Unauthorized");
        }

        // 2. Find associated conversation
        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_matchId", (q) => q.eq("matchId", match._id))
            .unique();

        // 3. Delete Conversation & Messages (if exists)
        if (conversation) {
            // Delete all messages (optimize this with scheduler later if too many)
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
                .collect();

            for (const msg of messages) {
                await ctx.db.delete(msg._id);
            }
            await ctx.db.delete(conversation._id);
        }

        // 4. Delete the Match records
        // Matches are stored as TWO records (User1->User2 AND User2->User1) if accepted?
        // Wait, my `likeProfile` logic inserts a SECOND record when accepted.
        // So "reverseMatch" is the other one.
        // We need to find BOTH and delete BOTH.

        const otherUserId = match.userId1 === currentUser._id ? match.userId2 : match.userId1;

        // Find the OTHER match record
        const otherMatch = await ctx.db
            .query("matches")
            .withIndex("by_users", (q) => q.eq("userId1", otherUserId).eq("userId2", currentUser._id))
            .unique();

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

        // 1. Add to Blocks table
        await ctx.db.insert("blocks", {
            blockerId: currentUser._id,
            blockedId: args.targetId,
            createdAt: Date.now(),
        });

        // 2. Perform Unmatch logic (delete matches/conversations)
        // Find existing matches
        const match1 = await ctx.db.query("matches").withIndex("by_users", q => q.eq("userId1", currentUser._id).eq("userId2", args.targetId)).unique();
        const match2 = await ctx.db.query("matches").withIndex("by_users", q => q.eq("userId1", args.targetId).eq("userId2", currentUser._id)).unique();

        const matchId = match1?._id || match2?._id;

        if (matchId) {
            // Find conversation
            const conversation = await ctx.db.query("conversations").withIndex("by_matchId", q => q.eq("matchId", matchId)).unique();
            if (conversation) {
                // Delete messages
                const messages = await ctx.db.query("messages").withIndex("by_conversationId", q => q.eq("conversationId", conversation._id)).collect();
                for (const msg of messages) await ctx.db.delete(msg._id);
                await ctx.db.delete(conversation._id);
            }
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

        // Auto-block usually follows a report, but let's keep them separate steps or call block logic?
        // User requirement: "Blocked automatically after report for safety."
        // We will call the block logic here implicitly by inserting the block.

        const alreadyBlocked = await ctx.db
            .query("blocks")
            .withIndex("by_block_pair", q => q.eq("blockerId", currentUser._id).eq("blockedId", args.targetId))
            .unique();

        if (!alreadyBlocked) {
            // Reuse block logic or just insert? Reusing is harder within same mutation without extraction. 
            // I'll just copy the block core logic (insert block + delete matches)
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
