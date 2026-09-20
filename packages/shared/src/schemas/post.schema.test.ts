import { describe, expect, it } from "vitest";
import { createPostSchema, opportunitiesQuerySchema } from "./post.schema.js";

const standard = { title: "Campus update", tags: "campus" };

describe("post opportunity schemas", () => {
  it("keeps clients that omit type backward compatible", () => {
    expect(createPostSchema.parse(standard).type).toBe("standard");
  });

  it("requires structured fields for an opportunity", () => {
    const result = createPostSchema.safeParse({ ...standard, type: "opportunity" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["opportunityType", "workplaceType", "companyName", "applyUrl"]),
      );
    }
  });

  it("accepts provider-agnostic HTTPS application links", () => {
    const result = createPostSchema.safeParse({
      ...standard,
      type: "opportunity",
      opportunityType: "internship",
      workplaceType: "hybrid",
      companyName: "Acme",
      applyUrl: "https://careers.example.com/apply/123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-HTTPS application links", () => {
    const result = createPostSchema.safeParse({
      ...standard,
      type: "opportunity",
      opportunityType: "internship",
      workplaceType: "hybrid",
      companyName: "Acme",
      applyUrl: "http://example.com/apply",
    });
    expect(result.success).toBe(false);
  });

  it("parses board filters and saved-only values", () => {
    expect(opportunitiesQuerySchema.parse({ savedOnly: "true", limit: "20" })).toEqual(
      expect.objectContaining({ savedOnly: true, limit: 20, status: "active", sort: "newest" }),
    );
  });
});
