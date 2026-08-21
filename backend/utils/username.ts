import crypto from "crypto";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

const RESERVED_USERNAMES = new Set([
  "admin",
  "support",
  "settings",
  "api",
  "groups",
  "u",
]);

// Keep this list intentionally explicit and review additions for false positives.
// Separators, common leetspeak substitutions, and exaggerated repeated letters
// are normalized before checking, so `f_u_c_k`, `f0ck`, and `fuuuck` cannot
// bypass moderation. The format rule still rejects symbols and Unicode lookalikes.
const DISALLOWED_USERNAME_TERMS = new Set([
  "asshole",
  "bastard",
  "bitch",
  "cunt",
  "dick",
  "fuck",
  "fucker",
  "fucking",
  "fock",
  "fvck",
  "motherfucker",
  "nude",
  "nsfw",
  "porn",
  "pussy",
  "sex",
  "shit",
  "slut",
  "whore",
  "cacat",
  "curva",
  "dracu",
  "dracului",
  "muie",
  "pizda",
  "pula",
  "rahat",
  "penis",
  "sugi",
  "futut",
  "fute",
  "fututa"

]);

export const canonicalizeUsername = (value: string) => value.trim().toLowerCase();

export const isReservedUsername = (username: string) =>
  RESERVED_USERNAMES.has(username);

const LEETSPEAK_SUBSTITUTIONS: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
};

const normalizeUsernameForModeration = (value: string) =>
  value
    .split("")
    .map((character) => LEETSPEAK_SUBSTITUTIONS[character] ?? character)
    .join("")
    .replace(/(.)\1{2,}/g, "$1");

export const containsDisallowedUsernameTerm = (username: string) => {
  const terms = username
    .split("_")
    .filter(Boolean)
    .map(normalizeUsernameForModeration);
  const compactUsername = normalizeUsernameForModeration(terms.join(""));
  return terms.some((term) => DISALLOWED_USERNAME_TERMS.has(term)) ||
    DISALLOWED_USERNAME_TERMS.has(compactUsername);
};

export const isValidUsername = (username: string) =>
  USERNAME_PATTERN.test(username) &&
  !isReservedUsername(username) &&
  !containsDisallowedUsernameTerm(username);

export const usernameValidationMessage = (username: string) => {
  if (!USERNAME_PATTERN.test(username)) {
    return "Username must be 3–30 lowercase letters, numbers, or underscores";
  }
  if (isReservedUsername(username)) return "That username is reserved";
  if (containsDisallowedUsernameTerm(username)) {
    return "That username contains restricted language";
  }
  return null;
};

export const isUsernameUniqueConstraintError = (error: unknown) => {
  if (!(error instanceof Error) || !("code" in error) || error.code !== "P2002") {
    return false;
  }
  const target = (error as { meta?: { target?: string[] | string } }).meta?.target;
  return Array.isArray(target) ? target.includes("username") : target === "username";
};

const usernameBaseFromDisplayName = (displayName?: string) => {
  const normalized = (displayName ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  return normalized.length >= 3 ? normalized.slice(0, 21) : "user";
};

// The random suffix avoids exposing an email address or predictable account data.
export const generateDefaultUsername = (displayName?: string) =>
  `${usernameBaseFromDisplayName(displayName)}_${crypto.randomBytes(4).toString("hex")}`;
