const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const FULL_DATETIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// For the edit form's date/time picker rows — full year included, unlike
// formatEventDateTime's card-facing "weekday, month, day" (a form is
// forward-looking, so the year keeps a late-December edit unambiguous).
export const formatEventDateTimeLabel = (value: Date): string => FULL_DATETIME_FORMAT.format(value);

export const formatEventDateTime = (startAt: string, endAt?: string | null): string => {
  const start = new Date(startAt);
  const datePart = DATE_FORMAT.format(start);
  const startTime = TIME_FORMAT.format(start);
  if (!endAt) return `${datePart} · ${startTime}`;

  const end = new Date(endAt);
  const sameDay = start.toDateString() === end.toDateString();
  const endTime = TIME_FORMAT.format(end);
  return sameDay
    ? `${datePart} · ${startTime} – ${endTime}`
    : `${datePart} ${startTime} – ${DATE_FORMAT.format(end)} ${endTime}`;
};
