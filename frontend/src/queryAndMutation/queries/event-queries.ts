import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createEventsApi } from "@universe/shared/api";
import { createEventQueries } from "@universe/shared/queries";
import type { EventParticipantStatus } from "../types";
import { httpClient } from "@/lib/api";

const eventsApi = createEventsApi(httpClient);
const eventQueries = createEventQueries(eventsApi);

export const useGetEventQuery = (id?: string) => useQuery(eventQueries.detail(id));

export const useDiscoverEventsInfiniteQuery = (enabled = true) =>
  useInfiniteQuery(eventQueries.discover(enabled));

export const useUpcomingUniversityEventsQuery = (enabled = true, limit?: number) =>
  useQuery(eventQueries.upcomingUniversity(limit, enabled));

export type MyEventsScope = "hosting" | "going" | "interested" | "waitlisted";

export const useMyEventsInfiniteQuery = (scope: MyEventsScope, enabled = true) =>
  useInfiniteQuery(eventQueries.mine(scope, enabled));

export const useGetEventParticipantsInfiniteQuery = (
  id?: string,
  status?: EventParticipantStatus,
  enabled = true,
  search?: string,
) => useInfiniteQuery(eventQueries.participants(id, status, search, enabled));

export const useGetEventBansInfiniteQuery = (id?: string, enabled = true) =>
  useInfiniteQuery(eventQueries.bans(id, enabled));
