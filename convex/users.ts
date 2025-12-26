import { mutation } from "./_generated/server";

export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user identity from Clerk
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;

    // Check if user already exists
    const existingUser = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId)).first();
    if (existingUser) {
      return existingUser;
    }

    // Create new user if not found
    const userId = await ctx.db.insert("users", {
      clerkId,
      createdAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});
