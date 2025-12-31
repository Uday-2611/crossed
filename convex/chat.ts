import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Define the return type explicitly
type ConversationWithPeer = Doc<"conversations"> & { peer: Doc<"profiles"> };

export const getConversations = query({
    args: {},
    handler: async (ctx): Promise<ConversationWithPeer[]> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) return [];

        // Conversations where I am user1
        const conversations1 = await ctx.db
            .query("conversations")
            .withIndex("by_user1", (q) => q.eq("user1", currentUser._id))
            .collect();

        // Conversations where I am user2
        const conversations2 = await ctx.db
            .query("conversations")
            .withIndex("by_user2", (q) => q.eq("user2", currentUser._id))
            .collect();

        const allConversations = [...conversations1, ...conversations2];

        const results: ConversationWithPeer[] = [];

        for (const conv of allConversations) {
            const peerId = (conv.user1 === currentUser._id ? conv.user2 : conv.user1) as Id<"profiles">;
            const peerProfile = await ctx.db.get(peerId);

            if (peerProfile) {
                results.push({
                    ...conv,
                    peer: peerProfile,
                });
            }
        }

        return results.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    },
});

export const getConversation = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args): Promise<ConversationWithPeer | null> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) return null;

        const conv = await ctx.db.get(args.conversationId);
        if (!conv) return null;

        if (conv.user1 !== currentUser._id && conv.user2 !== currentUser._id) {
            return null;
        }

        const peerId = (conv.user1 === currentUser._id ? conv.user2 : conv.user1) as Id<"profiles">;
        const peerProfile = await ctx.db.get(peerId);

        if (!peerProfile) return null;

        return {
            ...conv,
            peer: peerProfile,
        };
    },
});

export const getMessages = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Check if user is part of the conversation (security)
        const conv = await ctx.db.get(args.conversationId);
        if (!conv) throw new Error("Conversation not found");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser || (conv.user1 !== currentUser._id && conv.user2 !== currentUser._id)) {
            throw new Error("Unauthorized");
        }

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .order("desc") // Newest first
            .take(50); // Pagination limit for now

        return messages;
    },
});

export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        type: v.union(v.literal("text"), v.literal("image")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser) throw new Error("Profile not found");

        const conv = await ctx.db.get(args.conversationId);
        if (!conv) throw new Error("Conversation not found");

        // Verify participant
        if (conv.user1 !== currentUser._id && conv.user2 !== currentUser._id) {
            throw new Error("Unauthorized");
        }

        const peerId = conv.user1 === currentUser._id ? conv.user2 : conv.user1;

        // Check for Blocks
        const block1 = await ctx.db
            .query("blocks")
            .withIndex("by_block_pair", (q) => q.eq("blockerId", currentUser._id).eq("blockedId", peerId))
            .unique();
        const block2 = await ctx.db
            .query("blocks")
            .withIndex("by_block_pair", (q) => q.eq("blockerId", peerId).eq("blockedId", currentUser._id))
            .unique();

        if (block1 || block2) {
            throw new Error("Cannot send message to this user");
        }

        // Insert Message
        await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: currentUser._id,
            content: args.content,
            type: args.type,
            createdAt: Date.now(),
        });

        // Update Conversation Last Message
        await ctx.db.patch(args.conversationId, {
            lastMessage: {
                content: args.content,
                sender: currentUser._id,
                type: args.type,
            },
            lastMessageAt: Date.now(),
        });

        // Notify Recipient
        await ctx.scheduler.runAfter(0, internal.notifications.sendPushHelper, {
            targetProfileId: peerId as Id<"profiles">,
            title: currentUser.name,
            body: args.type === "image" ? "Sent an image" : args.content,
            data: { type: "message", conversationId: args.conversationId },
        });
    },
});

export const sendTypingIndicator = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("Profile not found");

        // Calculate expiration (e.g., 3 seconds from now)
        const expiresAt = Date.now() + 3000;

        // Upsert logic: Check if existing indicator exists for this user/convo
        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
            .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { expiresAt });
        } else {
            await ctx.db.insert("typingIndicators", {
                conversationId: args.conversationId,
                userId: currentUser._id,
                expiresAt,
            });
        }
    },
});

export const getTypingStatus = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("profiles")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        const now = Date.now();

        // Fetch indicators for this conversation
        const indicators = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        // Filter expired and self
        const activeTypers = indicators.filter(
            (i) => i.userId !== currentUser._id && i.expiresAt > now
        );

        return activeTypers;
    },
});