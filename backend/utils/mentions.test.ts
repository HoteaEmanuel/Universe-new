import { describe, expect, it } from "vitest";
import { extractMentionedUsernames } from "./mentions.js";

describe("extractMentionedUsernames", () => {
  it("extracts and lowercases @mentions from text", () => {
    expect(extractMentionedUsernames("hey @Jane_Doe and @bob123")).toEqual([
      "jane_doe",
      "bob123",
    ]);
  });

  it("ignores mentions shorter than 3 characters", () => {
    expect(extractMentionedUsernames("hi @ab")).toEqual([]);
  });

  it("returns an empty array for no mentions or null/undefined input", () => {
    expect(extractMentionedUsernames("no mentions here")).toEqual([]);
    expect(extractMentionedUsernames(null)).toEqual([]);
    expect(extractMentionedUsernames(undefined)).toEqual([]);
  });
});
