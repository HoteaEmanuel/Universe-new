import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalizeUsername,
  generateDefaultUsername,
  isUsernameUniqueConstraintError,
  isValidUsername,
  usernameValidationMessage,
} from "./username.js";

test("canonical usernames are lowercase and reject invalid or reserved handles", () => {
  assert.equal(canonicalizeUsername("  Campus_User  "), "campus_user");
  assert.equal(isValidUsername("campus_user"), true);
  assert.equal(isValidUsername("Admin"), false);
  assert.equal(usernameValidationMessage("admin"), "That username is reserved");
  assert.equal(isValidUsername("a!"), false);
});

test("usernames reject restricted language without overblocking substrings", () => {
  assert.equal(isValidUsername("study_fuck_buddy"), false);
  assert.equal(isValidUsername("f_u_c_k"), false);
  assert.equal(isValidUsername("f0ck"), false);
  assert.equal(isValidUsername("sh1t_happens"), false);
  assert.equal(isValidUsername("fuuuck"), false);
  assert.equal(isValidUsername("pula_mea"), false);
  assert.equal(isValidUsername("classmates"), true);
  assert.equal(
    usernameValidationMessage("study_fuck_buddy"),
    "That username contains restricted language",
  );
});

test("default usernames use a safe display-name stem and random non-email suffix", () => {
  const username = generateDefaultUsername("Ada Lovelace");
  assert.match(username, /^ada_lovelace_[a-f0-9]{8}$/);
  assert.equal(generateDefaultUsername("é").startsWith("user_"), true);
});

test("only a username unique constraint is classified as USERNAME_TAKEN", () => {
  const usernameConflict = Object.assign(new Error("duplicate"), {
    code: "P2002",
    meta: { target: ["username"] },
  });
  const emailConflict = Object.assign(new Error("duplicate"), {
    code: "P2002",
    meta: { target: ["email"] },
  });

  assert.equal(isUsernameUniqueConstraintError(usernameConflict), true);
  assert.equal(isUsernameUniqueConstraintError(emailConflict), false);
});
