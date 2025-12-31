import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Get list of users I have blocked
export const getBlockedUsers = query({
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

        if (!currentUser) return [];

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("Profile not found");

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("Profile not found");

        await ctx.db.patch(currentUser._id, { isVisible: args.isVisible });
    },
});

export const getNotificationSettings = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return null;

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            notificationSettings: {
                newMatch: args.newMatch,
                newMessage: args.newMessage,
            },
        });
    },
});
