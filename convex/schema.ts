import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),
});
