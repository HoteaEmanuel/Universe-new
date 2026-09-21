import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { createEventsApi } from "../api/events.js";
import type { EventParticipantStatus } from "../domain.js";
import { eventKeys } from "./keys.js";
import { cursorPagination } from "./pageHelpers.js";

type EventsApi = ReturnType<typeof createEventsApi>;
type MyEventsScope = "hosting" | "going" | "interested" | "waitlisted";

export const createEventQueries = (api: EventsApi) => ({
  detail: (id?: string) =>
    queryOptions({
      queryKey: eventKeys.detail(id ?? ""),
      queryFn: () => api.get(id as string),
      enabled: !!id,
    }),

  discover: (enabled = true) =>
    infiniteQueryOptions({
      queryKey: eventKeys.discover(),
      queryFn: ({ pageParam }) => api.discover(pageParam),
      ...cursorPagination(),
      enabled,
    }),

  upcomingUniversity: (limit?: number, enabled = true) =>
    queryOptions({
      queryKey: eventKeys.upcomingUniversity(limit),
      queryFn: () => api.upcomingUniversity(limit),
      enabled,
    }),

  mine: (scope: MyEventsScope, enabled = true) =>
    infiniteQueryOptions({
      queryKey: eventKeys.mine(scope),
      queryFn: ({ pageParam }) => api.listMine(scope, pageParam),
      ...cursorPagination(),
      enabled,
    }),

  participants: (
    id?: string,
    status?: EventParticipantStatus,
    search?: string,
    enabled = true,
  ) =>
    infiniteQueryOptions({
      queryKey: eventKeys.participants(id ?? "", status, search),
      queryFn: ({ pageParam }) => api.listParticipants(id as string, status, pageParam, search),
      ...cursorPagination(),
      enabled: !!id && enabled,
    }),

  bans: (id?: string, enabled = true) =>
    infiniteQueryOptions({
      queryKey: eventKeys.bans(id ?? ""),
      queryFn: ({ pageParam }) => api.listBans(id as string, pageParam),
      ...cursorPagination(),
      enabled: !!id && enabled,
    }),
});
