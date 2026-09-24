const DEADLINE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DEADLINE_DATETIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatOpportunityDeadline = (value?: string | null): string | null => {
  if (!value) return null;
  return DEADLINE_FORMAT.format(new Date(value));
};

export const formatOpportunityDeadlineDateTime = (value: Date): string =>
  DEADLINE_DATETIME_FORMAT.format(value);

export const isValidApplyUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    return new URL(trimmed).protocol === "https:";
  } catch {
    return false;
  }
};

export const applyUrlHostname = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};
