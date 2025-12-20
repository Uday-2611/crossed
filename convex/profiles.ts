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

        const userId = identity.subject;

        const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();

        return profile;
    },
});

// Create or update the current user's profile ->
export const upsertMyProfile = mutation({
    args: {
        name: v.string(),
        age: v.number(),
        bio: v.string(),
        gender: v.string(),
        sexuality: v.string(),
        height: v.number(),
        occupation: v.string(),
        religion: v.string(),
        location: v.string(),
        photos: v.array(v.string()),
        activities: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingProfile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .unique();

        if (existingProfile) {
            await ctx.db.patch(existingProfile._id, {
                ...args,
                updatedAt: Date.now(),
            });
            return existingProfile._id;
        } else {
            const newProfileId = await ctx.db.insert("profiles", {
                userId,
                ...args,
                updatedAt: Date.now(),
            });
            return newProfileId;
        }
    },
});
