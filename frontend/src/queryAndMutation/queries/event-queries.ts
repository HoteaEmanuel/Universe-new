import { createEventQueryHooks, type MyEventsScope } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export type { MyEventsScope };

export const {
  useGetEventQuery,
  useDiscoverEventsInfiniteQuery,
  useUpcomingUniversityEventsQuery,
  useMyEventsInfiniteQuery,
  useGetEventParticipantsInfiniteQuery,
  useGetEventBansInfiniteQuery,
} = createEventQueryHooks(httpClient);
