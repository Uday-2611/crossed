import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";


// Helper to get current profile
async function getCurrentProfile(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
        .query("profiles")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
        .unique();

    if (!profile) throw new Error("Profile not found");
    return profile;
}

// Helper to get current user settings
async function getCurrentUser(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
        .unique();

    if (!user) throw new Error("User not found");
    return user;
}

// Get list of users I have blocked
export const getBlockedUsers = query({
    args: {},
    handler: async (ctx) => {
        let currentUser;
        try {
            currentUser = await getCurrentProfile(ctx);
        } catch (e) {
            return []; // Return empty if profile not found (defensive)
        }

        const blocks = await ctx.db
            .query("blocks")
            .withIndex("by_blockerId", (q) => q.eq("blockerId", currentUser._id))
            .collect();

        const blockedProfiles = await Promise.all(
            blocks.map(async (block) => {
                const profile = await ctx.db.get(block.blockedId as Id<"profiles">);
                if (!profile) return null;
                return {
                    ...profile,
                    blockId: block._id,
                    blockedAt: block.createdAt
                };
            })
        );

        return blockedProfiles.filter((p): p is NonNullable<typeof p> => p !== null);
    },
});

// Unblock a user
export const unblockUser = mutation({
    args: { blockId: v.id("blocks") },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentProfile(ctx);

        const block = await ctx.db.get(args.blockId);
        if (!block) throw new Error("Block not found");

        if (block.blockerId !== currentUser._id) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.blockId);
    },
});

export const toggleVisibility = mutation({
    args: { isVisible: v.boolean() },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentProfile(ctx);

        await ctx.db.patch(currentUser._id, { isVisible: args.isVisible });
    },
});

export const getNotificationSettings = query({
    args: {},
    handler: async (ctx) => {
        let user;
        try {
            user = await getCurrentUser(ctx);
        } catch (e) {
            return null;
        }

        return {
            newMatch: user.notificationSettings?.newMatch ?? true,
            newMessage: user.notificationSettings?.newMessage ?? true,
        };
    },
});

export const updateNotificationSettings = mutation({
    args: {
        newMatch: v.boolean(),
        newMessage: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        await ctx.db.patch(user._id, {
            notificationSettings: {
                newMatch: args.newMatch,
                newMessage: args.newMessage,
            },
        });
    },
});
