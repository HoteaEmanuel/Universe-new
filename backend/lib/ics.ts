// RFC 5545 .ics generation for the calendar-export reminder flow (no
// scheduled jobs - see the Events feature spec's "Reminders" section for why
// Redis/BullMQ and the Google Calendar API were both ruled out).

interface IcsEventInput {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: Date;
  endAt?: Date | null;
  updatedAt: Date;
}

const toIcsDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
};

const escapeIcsText = (text: string): string => {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
};

export const buildIcsCalendar = (event: IcsEventInput): string => {
  const start = toIcsDate(event.startAt);
  // A point-in-time event (no endAt) still needs a non-zero duration to
  // render sensibly in calendar apps - default to a 1 hour block.
  const end = toIcsDate(event.endAt ?? new Date(event.startAt.getTime() + 60 * 60 * 1000));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Universe//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@universe`,
    `DTSTAMP:${toIcsDate(event.updatedAt)}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeIcsText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
};
