import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEventStore } from "../../store/eventStore";
import type {
  EventDetails,
  EventsPage,
  EventSummary,
  EventParticipantsPage,
  EventParticipantStatus,
  EventBansPage,
} from "../types";

export const useGetEventQuery = (id?: string) => {
  const { getEvent } = useEventStore();
  return useQuery<EventDetails>({
    queryFn: () => getEvent(id as string),
    queryKey: ["event", id],
    enabled: !!id,
  });
};

export const useDiscoverEventsInfiniteQuery = (enabled = true) => {
  const { discoverEvents } = useEventStore();
  return useInfiniteQuery<EventsPage>({
    queryKey: ["events-discover"],
    queryFn: ({ pageParam }) => discoverEvents(pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled,
  });
};

export const useUpcomingUniversityEventsQuery = (enabled = true, limit?: number) => {
  const { getUpcomingUniversityEvents } = useEventStore();
  return useQuery<{ events: EventSummary[] }>({
    queryFn: () => getUpcomingUniversityEvents(limit),
    queryKey: ["events-upcoming-university", limit],
    enabled,
  });
};

export type MyEventsScope = "hosting" | "going" | "interested" | "waitlisted";

export const useMyEventsInfiniteQuery = (scope: MyEventsScope, enabled = true) => {
  const { getMyEvents } = useEventStore();
  return useInfiniteQuery<EventsPage>({
    queryKey: ["events-mine", scope],
    queryFn: ({ pageParam }) => getMyEvents(scope, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled,
  });
};

export const useGetEventParticipantsInfiniteQuery = (
  id?: string,
  status?: EventParticipantStatus,
  enabled = true,
) => {
  const { getEventParticipants } = useEventStore();
  return useInfiniteQuery<EventParticipantsPage>({
    queryKey: ["event-participants", id, status],
    queryFn: ({ pageParam }) =>
      getEventParticipants(id as string, status, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!id && enabled,
  });
};

export const useGetEventBansInfiniteQuery = (id?: string, enabled = true) => {
  const { getEventBans } = useEventStore();
  return useInfiniteQuery<EventBansPage>({
    queryKey: ["event-bans", id],
    queryFn: ({ pageParam }) => getEventBans(id as string, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!id && enabled,
  });
};
