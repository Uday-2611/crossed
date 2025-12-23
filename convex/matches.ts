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
                return { ...profile, matchId: m._id };
            })
        );
        return results.filter(p => !!p);
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
                return { ...profile, matchId: m._id };
            })
        );
        return results.filter(p => !!p);
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
