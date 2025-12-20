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
        name: v.string(),
        age: v.number(),
        bio: v.string(),
        gender: v.string(),
        sexuality: v.string(),
        height: v.number(),
        occupation: v.string(),
        religion: v.string(),
        location: v.string(),
        university: v.optional(v.string()),
        politicalLeaning: v.optional(v.string()),
        datingIntentions: v.optional(v.string()),
        photos: v.array(v.string()),
        activities: v.array(v.string()),
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
            await ctx.db.patch(existingProfile._id, {
                ...args,
                updatedAt: Date.now(),
            });
            return existingProfile._id;
        } else {
            const newProfileId = await ctx.db.insert("profiles", {
                clerkId,
                ...args,
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
