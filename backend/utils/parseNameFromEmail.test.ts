import { describe, expect, it } from "vitest";
import { parseNameFromEmail } from "./parseNameFromEmail.js";

describe("parseNameFromEmail", () => {
  it("parses a firstname.lastname local part", () => {
    expect(parseNameFromEmail("jane.doe")).toEqual({
      firstName: "Jane",
      lastName: "Doe",
    });
  });

  it("strips trailing disambiguation digits", () => {
    expect(parseNameFromEmail("jane.doe42")).toEqual({
      firstName: "Jane",
      lastName: "Doe",
    });
  });

  it("capitalizes hyphenated name parts", () => {
    expect(parseNameFromEmail("mary-jane.smith-jones")).toEqual({
      firstName: "Mary-Jane",
      lastName: "Smith-Jones",
    });
  });

  it("returns null when there isn't exactly one dot", () => {
    expect(parseNameFromEmail("janedoe")).toBeNull();
    expect(parseNameFromEmail("jane.middle.doe")).toBeNull();
  });

  it("returns null when a part is too short after stripping digits", () => {
    expect(parseNameFromEmail("j.doe")).toBeNull();
    expect(parseNameFromEmail("jane.d")).toBeNull();
  });

  it("returns null when a part contains non-letter characters (not just trailing digits)", () => {
    expect(parseNameFromEmail("ja1ne.doe")).toBeNull();
    expect(parseNameFromEmail("jane_.doe")).toBeNull();
  });
});
