export const MENTION_PATTERN = /@([a-z0-9_]{3,30})\b/gi;

export const extractMentionedUsernames = (text?: string | null) =>
  [...(text ?? "").matchAll(MENTION_PATTERN)].map((match) => match[1].toLowerCase());
