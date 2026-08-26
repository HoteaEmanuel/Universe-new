import { describe, expect, it } from "vitest";
import { extractHashtagsFromText } from "./hashtags.js";

describe("extractHashtagsFromText", () => {
  it("extracts and lowercases hashtags from text", () => {
    expect(extractHashtagsFromText("Loving #CampusLife and #midterms")).toEqual([
      "campuslife",
      "midterms",
    ]);
  });

  it("returns an empty array when there are no hashtags", () => {
    expect(extractHashtagsFromText("no tags here")).toEqual([]);
  });

  it("returns an empty array for null or undefined input", () => {
    expect(extractHashtagsFromText(null)).toEqual([]);
    expect(extractHashtagsFromText(undefined)).toEqual([]);
  });
});
