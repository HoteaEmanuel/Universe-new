import type { HttpClient } from "./client.js";
import type { EventParticipantStatus } from "../domain.js";
import type {
  CreateEventPayload,
  EventBansPage,
  EventDetails,
  EventParticipant,
  EventParticipantsPage,
  EventsPage,
  EventSummary,
  UpdateEventPayload,
} from "../event.js";

type MyEventsScope = "hosting" | "going" | "interested" | "waitlisted";

export const createEventsApi = (client: HttpClient) => ({
  get: async (id: string) =>
    (await client.get<{ event: EventDetails }>(`/events/${id}`)).event,

  create: async (data: CreateEventPayload) =>
    (await client.post<{ event: EventSummary }>("/events", data)).event,

  update: async (id: string, data: UpdateEventPayload) =>
    (await client.patch<{ event: EventSummary }>(`/events/${id}`, data)).event,

  cancel: async (id: string) =>
    (await client.post<{ event: EventSummary }>(`/events/${id}/cancel`)).event,

  updateCoverImage: <TFile>(id: string, image: TFile) => {
    const form = client.createForm();
    form.append("image", image);
    return client.postForm<unknown>(`/events/${id}/change-cover-image`, form);
  },

  discover: (cursor?: string) =>
    client.get<EventsPage>("/events/discover", cursor ? { cursor } : undefined),

  upcomingUniversity: (limit?: number) =>
    client.get<{ events: EventSummary[] }>(
      "/events/discover/university",
      limit ? { limit } : undefined,
    ),

  listMine: (scope: MyEventsScope, cursor?: string) =>
    client.get<EventsPage>("/events/mine", { scope, ...(cursor ? { cursor } : {}) }),

  rsvp: async (id: string, status: "going" | "interested") =>
    (await client.post<{ participant: EventParticipant }>(`/events/${id}/rsvp`, { status }))
      .participant,

  cancelRsvp: (id: string) => client.delete<void>(`/events/${id}/rsvp`),

  listParticipants: (
    id: string,
    status?: EventParticipantStatus,
    cursor?: string,
    search?: string,
  ) =>
    client.get<EventParticipantsPage>(`/events/${id}/participants`, {
      ...(status ? { status } : {}),
      ...(cursor ? { cursor } : {}),
      ...(search ? { search } : {}),
    }),

  joinChat: async (id: string) =>
    (await client.post<{ group: { id: string } }>(`/events/${id}/join-chat`)).group,

  banParticipant: (id: string, userId: string, reason?: string) =>
    client.post<{ message: string }>(`/events/${id}/participants/${userId}/ban`, { reason }),

  unbanParticipant: (id: string, userId: string) =>
    client.delete<{ message: string }>(`/events/${id}/bans/${userId}`),

  listBans: (id: string, cursor?: string) =>
    client.get<EventBansPage>(`/events/${id}/bans`, cursor ? { cursor } : undefined),
});
