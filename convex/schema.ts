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
    photos: v.array(v.string()),
    activities: v.array(v.string()),
    updatedAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),
});
