import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  diseases: defineTable({
    name: v.string(),
    scientificName: v.string(),
    severity: v.union(v.literal("low"), v.literal("moderate"), v.literal("high")),
    symptoms: v.array(v.string()),
    causes: v.string(),
    prevention: v.array(v.string()),
    treatment: v.string(),
    description: v.string(),
  }),
  
  analyses: defineTable({
    userId: v.optional(v.id("users")),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    detectedDisease: v.string(),
    confidence: v.number(),
    severity: v.union(v.literal("low"), v.literal("moderate"), v.literal("high")),
    symptoms: v.array(v.string()),
    treatment: v.string(),
    sources: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
      snippet: v.string(),
    }))),
    status: v.union(
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
