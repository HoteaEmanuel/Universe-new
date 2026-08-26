import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./keysetCursor.js";

describe("keysetCursor", () => {
  it("round-trips updatedAt and id through encode/decode", () => {
    const updatedAt = new Date("2026-01-01T12:34:56.000Z");
    const cursor = encodeCursor(updatedAt, "row-1");

    const decoded = decodeCursor(cursor);

    expect(decoded.id).toBe("row-1");
    expect(decoded.updatedAt.toISOString()).toBe(updatedAt.toISOString());
  });

  it("produces an opaque, non-guessable-looking base64url string", () => {
    const cursor = encodeCursor(new Date("2026-01-01T00:00:00.000Z"), "row-1");
    expect(cursor).not.toContain("row-1");
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
