const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatChatListTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (isSameDay(date, now)) return TIME_FORMAT.format(date);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Yesterday";

  if (diffMs < 6 * 24 * 60 * 60 * 1000) return WEEKDAY_FORMAT.format(date);

  return DATE_FORMAT.format(date);
};
