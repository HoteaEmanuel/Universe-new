import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createEventsApi } from "../api/events.js";
import type { HttpClient } from "../api/client.js";
import type { EventParticipantStatus } from "../domain.js";
import { eventKeys } from "./keys.js";
import { cursorPagination } from "./pageHelpers.js";

type EventsApi = ReturnType<typeof createEventsApi>;
export type MyEventsScope = "hosting" | "going" | "interested" | "waitlisted";

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

// Ready-to-use hooks for every read-only, side-effect-free event query —
// see the identical note on createUserQueryHooks in ./users.ts for why this
// exists instead of each app redeclaring the same useQuery wrapper.
export const createEventQueryHooks = (httpClient: HttpClient) => {
  const api = createEventsApi(httpClient);
  const queries = createEventQueries(api);
  return {
    useGetEventQuery: (id?: string) => useQuery(queries.detail(id)),
    useDiscoverEventsInfiniteQuery: (enabled = true) => useInfiniteQuery(queries.discover(enabled)),
    useUpcomingUniversityEventsQuery: (enabled = true, limit?: number) =>
      useQuery(queries.upcomingUniversity(limit, enabled)),
    useMyEventsInfiniteQuery: (scope: MyEventsScope, enabled = true) =>
      useInfiniteQuery(queries.mine(scope, enabled)),
    useGetEventParticipantsInfiniteQuery: (
      id?: string,
      status?: EventParticipantStatus,
      enabled = true,
      search?: string,
    ) => useInfiniteQuery(queries.participants(id, status, search, enabled)),
    useGetEventBansInfiniteQuery: (id?: string, enabled = true) =>
      useInfiniteQuery(queries.bans(id, enabled)),
  };
};
