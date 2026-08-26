import { describe, expect, it } from "vitest";
import {
  canonicalizeUsername,
  generateDefaultUsername,
  isUsernameUniqueConstraintError,
  isValidUsername,
  usernameValidationMessage,
} from "./username.js";

describe("username validation", () => {
  it("canonical usernames are lowercase and reject invalid or reserved handles", () => {
    expect(canonicalizeUsername("  Campus_User  ")).toBe("campus_user");
    expect(isValidUsername("campus_user")).toBe(true);
    expect(isValidUsername("Admin")).toBe(false);
    expect(usernameValidationMessage("admin")).toBe("That username is reserved");
    expect(isValidUsername("a!")).toBe(false);
  });

  it("usernames reject restricted language without overblocking substrings", () => {
    expect(isValidUsername("study_fuck_buddy")).toBe(false);
    expect(isValidUsername("f_u_c_k")).toBe(false);
    expect(isValidUsername("f0ck")).toBe(false);
    expect(isValidUsername("sh1t_happens")).toBe(false);
    expect(isValidUsername("fuuuck")).toBe(false);
    expect(isValidUsername("pula_mea")).toBe(false);
    expect(isValidUsername("classmates")).toBe(true);
    expect(usernameValidationMessage("study_fuck_buddy")).toBe(
      "That username contains restricted language",
    );
  });

  it("default usernames use a safe display-name stem and random non-email suffix", () => {
    const username = generateDefaultUsername("Ada Lovelace");
    expect(username).toMatch(/^ada_lovelace_[a-f0-9]{8}$/);
    expect(generateDefaultUsername("é").startsWith("user_")).toBe(true);
  });

  it("only a username unique constraint is classified as USERNAME_TAKEN", () => {
    const usernameConflict = Object.assign(new Error("duplicate"), {
      code: "P2002",
      meta: { target: ["username"] },
    });
    const emailConflict = Object.assign(new Error("duplicate"), {
      code: "P2002",
      meta: { target: ["email"] },
    });

    expect(isUsernameUniqueConstraintError(usernameConflict)).toBe(true);
    expect(isUsernameUniqueConstraintError(emailConflict)).toBe(false);
  });
});
