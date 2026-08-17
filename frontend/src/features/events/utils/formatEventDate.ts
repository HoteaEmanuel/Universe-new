import type { EventSummary } from "@/queryAndMutation/types";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
};
const TIME_OPTIONS: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

export const formatEventDateTime = (startAt: string, endAt?: string | null): string => {
  const start = new Date(startAt);
  const datePart = start.toLocaleDateString(undefined, DATE_OPTIONS);
  const startTime = start.toLocaleTimeString(undefined, TIME_OPTIONS);
  if (!endAt) return `${datePart} · ${startTime}`;

  const end = new Date(endAt);
  const sameDay = start.toDateString() === end.toDateString();
  const endTime = end.toLocaleTimeString(undefined, TIME_OPTIONS);
  return sameDay
    ? `${datePart} · ${startTime} – ${endTime}`
    : `${datePart} ${startTime} – ${end.toLocaleDateString(undefined, DATE_OPTIONS)} ${endTime}`;
};

// dates as YYYYMMDDTHHMMSSZ per Google's calendar template URL format.
const toGoogleDate = (date: Date) =>
  date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

export const buildGoogleCalendarUrl = (event: EventSummary): string => {
  const start = toGoogleDate(new Date(event.startAt));
  const end = toGoogleDate(new Date(event.endAt ?? new Date(new Date(event.startAt).getTime() + 60 * 60 * 1000)));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    ...(event.description ? { details: event.description } : {}),
    ...(event.location ? { location: event.location } : event.virtualUrl ? { location: event.virtualUrl } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
