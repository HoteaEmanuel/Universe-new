import { describe, expect, it } from "vitest";
import { generateVerificationToken } from "./generateVerificationCode.js";

describe("generateVerificationToken", () => {
  it("returns a 6-digit numeric string in range", () => {
    for (let i = 0; i < 50; i += 1) {
      const token = generateVerificationToken();
      expect(token).toMatch(/^\d{6}$/);
      const value = Number(token);
      expect(value).toBeGreaterThanOrEqual(100_000);
      expect(value).toBeLessThan(1_000_000);
    }
  });

  it("does not always return the same value", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateVerificationToken()));
    expect(tokens.size).toBeGreaterThan(1);
  });
});
