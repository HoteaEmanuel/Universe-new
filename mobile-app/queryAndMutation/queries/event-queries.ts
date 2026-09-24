import { createEventQueryHooks, type MyEventsScope } from "@universe/shared/queries";
import { httpClient } from "../../lib/http";

export type { MyEventsScope };

export const {
  useGetEventQuery,
  useDiscoverEventsInfiniteQuery,
  useMyEventsInfiniteQuery,
  useGetEventParticipantsInfiniteQuery,
} = createEventQueryHooks(httpClient);
