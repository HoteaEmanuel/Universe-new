// Pure Date/Intl helpers for the message thread's per-message timestamp and
// day separators. Kept mobile-only (like chatListTime.ts/chatAvatarColor.ts)
// since web's MessageThread doesn't have a day-separator pattern yet.
const TIME_FORMAT = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" });
const DAY_WITH_YEAR_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
const DETAIL_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** A stable per-calendar-day key, for grouping messages into day separators. */
export const dayKey = (dateString: string) => new Date(dateString).toDateString();

/** "Today" / "Yesterday" / "September 23" / "September 23, 2025" — the big centered separator label. */
export const formatDaySeparator = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  if (isSameDay(date, now)) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.getFullYear() === now.getFullYear()
    ? DAY_FORMAT.format(date)
    : DAY_WITH_YEAR_FORMAT.format(date);
};

/** "10:42 PM" — what a bubble shows by default, since the day separator already carries the date. */
export const formatMessageTime = (dateString: string) => TIME_FORMAT.format(new Date(dateString));

/** "Wed, Sep 23, 2026 · 10:42 PM" — revealed when a message is pressed. */
export const formatMessageDetail = (dateString: string) => {
  const date = new Date(dateString);
  return `${DETAIL_DATE_FORMAT.format(date)} · ${TIME_FORMAT.format(date)}`;
};
