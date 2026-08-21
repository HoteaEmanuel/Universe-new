export const HASHTAG_PATTERN = /#([a-z0-9_]{1,50})\b/gi;

export const extractHashtagsFromText = (text?: string | null) =>
  [...(text ?? "").matchAll(HASHTAG_PATTERN)].map((match) => match[1].toLowerCase());
