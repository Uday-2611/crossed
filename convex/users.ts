import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Ensure the authenticated Clerk user exists in Convex.
 * This should be called once after login.
 */
export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    // 1️⃣ Get authenticated user identity from Clerk
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;

    // 2️⃣ Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser) {
      return existingUser;
    }

    // 3️⃣ Create new user if not found
    const userId = await ctx.db.insert("users", {
      clerkId,
      createdAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});
