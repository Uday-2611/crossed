import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, mutation } from "./_generated/server";

// Mutation to save the Expo Push Token for the current user
export const savePushToken = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, { pushToken: args.token });
        } else {
            // Create user record if it doesn't exist (e.g., first login)
            await ctx.db.insert("users", {
                clerkId: identity.subject,
                createdAt: Date.now(),
                pushToken: args.token,
            });
        }
    },
});

// Helper mutation to get a user's push token by their Profile ID
// We need this because interactions (Like/Message) happen via Profile IDs,
// but tokens are stored in the 'users' table keyed by clerkId.
export const getMyPushToken = internalMutation({
    args: { profileId: v.id("profiles") },
    handler: async (ctx, args) => {
        const profile = await ctx.db.get(args.profileId);
        if (!profile) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", profile.clerkId))
            .unique();

        return user?.pushToken;
    },
});

// Internal Action to send the actual Push Notification via Expo API
export const sendPushAction = internalAction({
    args: {
        to: v.string(),
        title: v.string(),
        body: v.string(),
        data: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const message = {
            to: args.to,
            sound: "default",
            title: args.title,
            body: args.body,
            data: args.data || {},
        };

        try {
            await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(message),
            });
        } catch (error) {
            console.error("Error sending push notification:", error);
        }
    },
});

// One-stop shop helper to be called from other mutations (matches/chats)
export const sendPushHelper = internalMutation({
    args: {
        targetProfileId: v.id("profiles"),
        title: v.string(),
        body: v.string(),
        data: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        // 1. Get the target user's push token
        // We reuse the logic from getMyPushToken but inline here for simplicity in the internal call
        const targetProfile = await ctx.db.get(args.targetProfileId);
        if (!targetProfile) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", targetProfile.clerkId))
            .unique();

        if (user && user.pushToken) {
            // 2. Schedule the action to send the push
            await ctx.scheduler.runAfter(0, internal.notifications.sendPushAction, {
                to: user.pushToken,
                title: args.title,
                body: args.body,
                data: args.data,
            });
        }
    },
});
