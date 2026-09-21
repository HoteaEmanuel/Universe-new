import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { createEventsApi } from "../api/events.js";
import type { CreateEventPayload, UpdateEventPayload } from "../event.js";
import { eventKeys } from "../queries/keys.js";

type EventsApi = ReturnType<typeof createEventsApi>;

// Toasts are composed at the call site (app-local); these factories own
// only mutationFn + cache invalidation, identical across platforms.
export const createEventMutations = (api: EventsApi, queryClient: QueryClient) => ({
  create: () =>
    mutationOptions({
      mutationFn: (data: CreateEventPayload) => api.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: eventKeys.discover() });
        queryClient.invalidateQueries({ queryKey: eventKeys.mineAll() });
      },
    }),

  update: (eventId?: string) =>
    mutationOptions({
      mutationFn: (data: UpdateEventPayload) => api.update(eventId as string, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId ?? "") });
        queryClient.invalidateQueries({ queryKey: eventKeys.discover() });
        queryClient.invalidateQueries({ queryKey: eventKeys.mineAll() });
      },
    }),

  cancel: (eventId?: string) =>
    mutationOptions({
      mutationFn: () => api.cancel(eventId as string),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId ?? "") });
        queryClient.invalidateQueries({ queryKey: eventKeys.discover() });
        queryClient.invalidateQueries({ queryKey: eventKeys.mineAll() });
      },
    }),

  // Takes the event id at call time (not hook-creation time) so one hook
  // instance can cover both the create-then-upload and edit-then-upload
  // flows, the former not knowing the event's id until creation succeeds.
  updateCoverImage: <TFile>() =>
    mutationOptions({
      mutationFn: ({ eventId, image }: { eventId: string; image: TFile }) =>
        api.updateCoverImage(eventId, image),
      onSuccess: (_data, { eventId }) => {
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      },
    }),

  rsvp: (eventId?: string) =>
    mutationOptions({
      mutationFn: (status: "going" | "interested") => api.rsvp(eventId as string, status),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId ?? "") });
        queryClient.invalidateQueries({ queryKey: eventKeys.mineAll() });
        queryClient.invalidateQueries({
          queryKey: ["event-participants", eventId],
        });
      },
    }),

  cancelRsvp: (eventId?: string) =>
    mutationOptions({
      mutationFn: () => api.cancelRsvp(eventId as string),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId ?? "") });
        queryClient.invalidateQueries({ queryKey: eventKeys.mineAll() });
        queryClient.invalidateQueries({
          queryKey: ["event-participants", eventId],
        });
      },
    }),

  joinChat: (eventId?: string) =>
    mutationOptions({
      mutationFn: () => api.joinChat(eventId as string),
    }),

  banParticipant: (eventId?: string) =>
    mutationOptions({
      mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
        api.banParticipant(eventId as string, userId, reason),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId ?? "") });
        queryClient.invalidateQueries({
          queryKey: ["event-participants", eventId],
        });
        queryClient.invalidateQueries({ queryKey: eventKeys.bans(eventId ?? "") });
      },
    }),

  unbanParticipant: (eventId?: string) =>
    mutationOptions({
      mutationFn: (userId: string) => api.unbanParticipant(eventId as string, userId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: eventKeys.bans(eventId ?? "") });
      },
    }),
});
