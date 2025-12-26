import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getMyProfile = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const clerkId = identity.subject;

        const profile = await ctx.db.query("profiles").withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId)).unique();

        return profile;
    },
});

export const upsertMyProfile = mutation({
    args: {
        name: v.optional(v.string()),
        age: v.optional(v.number()),
        bio: v.optional(v.string()),
        gender: v.optional(v.string()),
        sexuality: v.optional(v.string()),
        height: v.optional(v.number()),
        occupation: v.optional(v.string()),
        religion: v.optional(v.string()),
        location: v.optional(v.string()),
        university: v.optional(v.string()),
        politicalLeaning: v.optional(v.string()),
        datingIntentions: v.optional(v.string()),
        isStudent: v.optional(v.boolean()),
        photos: v.optional(v.array(v.string())),
        activities: v.optional(v.array(v.string())),
        datingPreferences: v.optional(v.object({
            ageRange: v.optional(v.array(v.number())),
            maxDistanceKm: v.optional(v.number()),
            interestedIn: v.optional(v.string()),
            religion: v.optional(v.array(v.string())),
        })),
        isOnboardingComplete: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const clerkId = identity.subject;

        const existingProfile = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (existingProfile) {
            let activitiesUpdatedAt = existingProfile.activitiesUpdatedAt;

            // Check if activities changed
            if (args.activities) {
                const activitiesChanged = JSON.stringify(existingProfile.activities) !== JSON.stringify(args.activities);

                if (activitiesChanged) {
                    const now = Date.now();
                    const sevenDays = 7 * 24 * 60 * 60 * 1000;

                    if (activitiesUpdatedAt && (now - activitiesUpdatedAt < sevenDays)) {
                        const daysLeft = Math.ceil((sevenDays - (now - activitiesUpdatedAt)) / (24 * 60 * 60 * 1000));
                        throw new Error(`Activities can only be updated once every 7 days. You can update again in ${daysLeft} days.`);
                    }

                    activitiesUpdatedAt = now;
                }
            }

            // Merge datingPreferences to preserve existing nested fields
            const mergedDatingPreferences = args.datingPreferences
                ? { ...existingProfile.datingPreferences, ...args.datingPreferences }
                : existingProfile.datingPreferences;

            await ctx.db.patch(existingProfile._id, {
                ...args,
                datingPreferences: mergedDatingPreferences,
                activitiesUpdatedAt,
                updatedAt: Date.now(),
            });
            return existingProfile._id;
        } else {
            // Default values for new profile to satisfy schema constraints if args are missing
            const defaults = {
                name: "",
                age: 18,
                bio: "",
                gender: "",
                sexuality: "",
                height: 0,
                occupation: "",
                religion: "",
                location: "",
                photos: [],
                activities: [],
            };

            const newProfileId = await ctx.db.insert("profiles", {
                clerkId,
                ...defaults,
                ...args,
                activitiesUpdatedAt: args.activities ? Date.now() : undefined,
                updatedAt: Date.now(),
            });
            return newProfileId;
        }
    },
});

export const deleteMyAccount = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const clerkId = identity.subject;

        // 1. Get Profile to have the _id
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (profile) {
            const userId = profile._id;

            // A. Cleanup Matches (Both sides)
            const matches1 = await ctx.db.query("matches").withIndex("by_userId1", q => q.eq("userId1", userId)).collect();
            const matches2 = await ctx.db.query("matches").withIndex("by_userId2", q => q.eq("userId2", userId)).collect();
            for (const m of [...matches1, ...matches2]) await ctx.db.delete(m._id);

            // B. Cleanup Conversations & Messages
            const convs1 = await ctx.db.query("conversations").withIndex("by_user1", q => q.eq("user1", userId)).collect();
            const convs2 = await ctx.db.query("conversations").withIndex("by_user2", q => q.eq("user2", userId)).collect();
            const allConvs = [...convs1, ...convs2];

            for (const conv of allConvs) {
                const messages = await ctx.db.query("messages").withIndex("by_conversationId", q => q.eq("conversationId", conv._id)).collect();
                for (const msg of messages) await ctx.db.delete(msg._id);
                await ctx.db.delete(conv._id);
            }

            // C. Cleanup Blocks (By me and Of me)
            const blocksBy = await ctx.db.query("blocks").withIndex("by_blockerId", q => q.eq("blockerId", userId)).collect();
            const blocksOf = await ctx.db.query("blocks").withIndex("by_blockedId", q => q.eq("blockedId", userId)).collect();
            for (const b of [...blocksBy, ...blocksOf]) await ctx.db.delete(b._id);

            // D. Cleanup Rejections (By me)
            const rejections = await ctx.db.query("rejections").withIndex("by_userId", q => q.eq("userId", userId)).collect();
            for (const r of rejections) await ctx.db.delete(r._id);

            // E. Cleanup Locations
            const locations = await ctx.db.query("locations").withIndex("by_userId", q => q.eq("userId", userId)).collect();
            for (const l of locations) await ctx.db.delete(l._id);

            // F. Delete Profile
            await ctx.db.delete(profile._id);
        }

        // 2. Delete User Record
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .unique();

        if (user) {
            await ctx.db.delete(user._id);
        }
    },
});

export const get = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const currentUser = await ctx.db.query("profiles").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();

        if (!currentUser) {
            return null;
        }

        const targetId = args.id as any;

        // 1. Self Check
        if (currentUser._id === targetId) {
            return await ctx.db.get(targetId);
        }

        // 2. Block Check
        const blockedBy = await ctx.db.query("blocks").withIndex("by_block_pair", q => q.eq("blockerId", targetId).eq("blockedId", currentUser._id)).first();
        const blocked = await ctx.db.query("blocks").withIndex("by_block_pair", q => q.eq("blockerId", currentUser._id).eq("blockedId", targetId)).first();

        if (blockedBy || blocked) {
            return null;
        }

        // 3. Return Profile
        return await ctx.db.get(targetId);
    },
});