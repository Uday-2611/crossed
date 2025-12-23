import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  profiles: defineTable({
    clerkId: v.string(), // Clerk userId
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
    updatedAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),


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
});
