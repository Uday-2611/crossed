import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save a new location
export const saveLocation = mutation({
    args: {
        name: v.string(),
        lat: v.number(),
        lng: v.number(),
        geohash: v.string(),
        category: v.optional(v.string()),
        address: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const savedAt = Date.now();

        const locationId = await ctx.db.insert("locations", {
            userId: identity.subject,
            name: args.name,
            lat: args.lat,
            lng: args.lng,
            geohash: args.geohash,
            category: args.category,
            address: args.address,
            savedAt,
        });

        return locationId;
    },
});

// Get all locations for the current user
export const getMyLocations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const locations = await ctx.db
            .query("locations")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .collect();

        return locations;
    },
});

// Delete a location
export const deleteLocation = mutation({
    args: { locationId: v.id("locations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const location = await ctx.db.get(args.locationId);
        if (!location) {
            throw new Error("Location not found");
        }

        if (location.userId !== identity.subject) {
            throw new Error("Unauthorized to delete this location");
        }

        await ctx.db.delete(args.locationId);
    },
});
