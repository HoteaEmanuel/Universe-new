export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
export const RESERVED_USERNAMES = new Set([
  "admin", "support", "settings", "api", "groups", "u",
]);
const DISALLOWED_USERNAME_TERMS = new Set([
  "asshole", "bastard", "bitch", "cunt", "dick", "fuck", "fucker", "fucking", "fock", "fvck",
  "motherfucker", "nude", "nsfw", "porn", "pussy", "sex", "shit", "slut", "whore",
  "cacat", "curva", "dracu", "dracului", "muie", "pizda", "pula", "rahat",
]);

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
  return terms.some((term) => DISALLOWED_USERNAME_TERMS.has(term)) ||
    DISALLOWED_USERNAME_TERMS.has(normalizeUsernameForModeration(terms.join("")));
};

export const validateUsernameFormat = (username: string): string | null => {
  if (!USERNAME_PATTERN.test(username)) {
    return "Use 3–30 lowercase letters, numbers, or underscores.";
  }
  if (RESERVED_USERNAMES.has(username)) return "That username is reserved.";
  if (containsDisallowedUsernameTerm(username)) {
    return "That username contains restricted language.";
  }
  return null;
};
