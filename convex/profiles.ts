import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get current user's profile and return null if no profile exists ->
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

// Create or update the current user's profile ->
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
            // Only check if args.activities is provided
            if (args.activities) {
                const activitiesChanged = JSON.stringify(existingProfile.activities) !== JSON.stringify(args.activities);

                if (activitiesChanged) {
                    const now = Date.now();
                    const sevenDays = 7 * 24 * 60 * 60 * 1000;

                    if (activitiesUpdatedAt && (now - activitiesUpdatedAt < sevenDays)) {
                        const daysLeft = Math.ceil((sevenDays - (now - activitiesUpdatedAt)) / (24 * 60 * 60 * 1000));
                        throw new Error(`Activities can only be updated once every 7 days. You can update again in ${daysLeft} days.`);
                    }

                    // Update timestamp since we are successfully updating activities
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

        // 1. Delete User Record (if exists)
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .first();

        if (user) {
            await ctx.db.delete(user._id);
        }

        // 2. Delete Profile Record
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
            .first();

        if (profile) {
            await ctx.db.delete(profile._id);
        }

        // TODO: Delete Matches, Chats, etc. when those tables are active
    },
});
