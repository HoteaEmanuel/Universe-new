import { z } from "zod";

const title = z
  .string()
  .min(3, "Title should have at least 3 characters")
  .max(100, "Title should have less than 100 characters");

const description = z
  .string()
  .max(2200, "Description should have less than 2200 characters")
  .optional();

const location = z
  .string()
  .max(150, "Location should have less than 150 characters")
  .optional();

const virtualUrl = z
  .string()
  .url("virtualUrl must be a valid URL")
  .max(500)
  .optional();

const capacity = z.coerce.number().int().min(1).max(100_000).optional();

export const createEventSchema = z
  .object({
    title,
    description,
    location,
    virtualUrl,
    startAt: z.coerce.date(),
    endAt: z.coerce.date().optional(),
    visibility: z.enum(["public", "private"]).optional(),
    capacity,
    hostGroupId: z.string().uuid("hostGroupId must be a valid id").optional(),
  })
  .refine((data) => !data.endAt || data.endAt > data.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    title: title.optional(),
    description,
    location,
    virtualUrl,
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    capacity,
  })
  .refine((data) => !data.startAt || !data.endAt || data.endAt > data.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const rsvpEventSchema = z.object({
  status: z.enum(["going", "interested"]),
});
export type RsvpEventInput = z.infer<typeof rsvpEventSchema>;

export const discoverEventsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type DiscoverEventsQueryInput = z.infer<typeof discoverEventsQuerySchema>;

export const myEventsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  scope: z.enum(["hosting", "going", "interested", "waitlisted"]).default("going"),
});
export type MyEventsQueryInput = z.infer<typeof myEventsQuerySchema>;

export const eventParticipantsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
  status: z.enum(["going", "interested", "waitlisted"]).optional(),
});
export type EventParticipantsQueryInput = z.infer<typeof eventParticipantsQuerySchema>;
