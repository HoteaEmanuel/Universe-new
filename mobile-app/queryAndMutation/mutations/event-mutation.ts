import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventsApi } from "@universe/shared/api";
import { createEventMutations } from "@universe/shared/mutations";
import { httpClient } from "../../lib/http";

const eventsApi = createEventsApi(httpClient);

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createEventMutations(eventsApi, queryClient).create());
};

export const useRsvpEventMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createEventMutations(eventsApi, queryClient).rsvp(eventId));
};

export const useCancelRsvpMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createEventMutations(eventsApi, queryClient).cancelRsvp(eventId));
};

export const useJoinEventChatMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createEventMutations(eventsApi, queryClient).joinChat(eventId));
};

export const useUpdateEventMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createEventMutations(eventsApi, queryClient).update(eventId));
};

export const useCancelEventMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createEventMutations(eventsApi, queryClient).cancel(eventId));
};

export const useInviteToEventMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createEventMutations(eventsApi, queryClient).inviteParticipant(eventId));
};

export const useBanEventParticipantMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createEventMutations(eventsApi, queryClient).banParticipant(eventId));
};
