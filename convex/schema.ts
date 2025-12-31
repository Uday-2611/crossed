import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    createdAt: v.number(),
    pushToken: v.optional(v.string()),
    notificationSettings: v.optional(v.object({
      newMatch: v.boolean(),
      newMessage: v.boolean(),
    })),
  }).index("by_clerkId", ["clerkId"]),

  profiles: defineTable({
    clerkId: v.string(),
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
    isStudent: v.optional(v.boolean()),
    photos: v.array(v.string()),
    activities: v.array(v.string()),
    activitiesUpdatedAt: v.optional(v.number()),
    datingPreferences: v.optional(v.object({
      ageRange: v.optional(v.array(v.number())),
      maxDistanceKm: v.optional(v.number()),
      interestedIn: v.optional(v.string()),
      religion: v.optional(v.array(v.string())),
    })),
    isOnboardingComplete: v.optional(v.boolean()),
    isVisible: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_gender", ["gender"]),

  locations: defineTable({
    userId: v.string(),
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
    geohash: v.string(),
    category: v.optional(v.string()),
    address: v.optional(v.string()),
    savedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_geohash", ["geohash"]),

  // Matches
  matches: defineTable({
    userId1: v.string(), // The actor (person who swiped right)
    userId2: v.string(), // The target
    status: v.string(),  // "pending" (one-way), "accepted" (match), "rejected" (explicit unmatch after match)
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId1", ["userId1"])
    .index("by_userId2", ["userId2"])
    .index("by_users", ["userId1", "userId2"]),

  // Conversations (Chat Rooms)
  conversations: defineTable({
    matchId: v.id("matches"), user1: v.string(),
    user2: v.string(),
    lastMessage: v.optional(v.object({
      content: v.string(),
      sender: v.string(),
      type: v.union(v.literal("text"), v.literal("image")),
    })), lastMessageAt: v.number(),
  })
    .index("by_matchId", ["matchId"])
    .index("by_user1", ["user1"])
    .index("by_user2", ["user2"]),

  // Messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image")),
    createdAt: v.number(),
  }).index("by_conversationId", ["conversationId"]),

  // Rejections (Swipe Left / Pass)
  rejections: defineTable({
    userId: v.string(),        // The actor
    rejectedUserId: v.string(), // The target
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Blocks
  blocks: defineTable({
    blockerId: v.string(),
    blockedId: v.string(),
    createdAt: v.number(),
  })
    .index("by_blockerId", ["blockerId"])
    .index("by_blockedId", ["blockedId"])
    .index("by_block_pair", ["blockerId", "blockedId"]),

  // Reports
  reports: defineTable({
    reporterId: v.string(),
    reportedId: v.string(),
    reason: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_reporterId", ["reporterId"])
    .index("by_reportedId", ["reportedId"]),

  // Typing Indicators (Ephemeral)
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    expiresAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_user", ["userId"]),
});
