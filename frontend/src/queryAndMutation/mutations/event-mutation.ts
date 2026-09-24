import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventsApi } from "@universe/shared/api";
import { createEventMutations } from "@universe/shared/mutations";
import { toast } from "sonner";
import { httpClient } from "@/lib/api";

const eventsApi = createEventsApi(httpClient);

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();
  const shared = createEventMutations(eventsApi, queryClient).create();
  return useMutation({
    ...shared,
    onSuccess: (data, post, onMutateResult, context) => {
      shared.onSuccess?.(data, post, onMutateResult, context);
      toast.success("Event created");
    },
  });
};

export const useUpdateEventMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const shared = createEventMutations(eventsApi, queryClient).update(eventId);
  return useMutation({
    ...shared,
    onSuccess: (data, post, onMutateResult, context) => {
      shared.onSuccess?.(data, post, onMutateResult, context);
      toast.success("Event updated");
    },
  });
};

export const useCancelEventMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const shared = createEventMutations(eventsApi, queryClient).cancel(eventId);
  return useMutation({
    ...shared,
    onSuccess: (data, post, onMutateResult, context) => {
      shared.onSuccess?.(data, post, onMutateResult, context);
      toast.success("Event cancelled");
    },
  });
};

// No success toast here on purpose: every call site chains this after its
// own create/update mutation succeeds (see EventFormModal.tsx), which
// already shows its own toast - a second one here would be redundant.
export const useUpdateEventCoverImageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createEventMutations(eventsApi, queryClient).updateCoverImage<File>());
};

export const useRsvpEventMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const shared = createEventMutations(eventsApi, queryClient).rsvp(eventId);
  return useMutation({
    ...shared,
    onSuccess: (participant, status, onMutateResult, context) => {
      shared.onSuccess?.(participant, status, onMutateResult, context);
      toast.success(
        participant.status === "waitlisted"
          ? "You're on the waitlist"
          : participant.status === "going"
            ? "You're going!"
            : "Marked as interested",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useCancelRsvpMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const shared = createEventMutations(eventsApi, queryClient).cancelRsvp(eventId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("RSVP removed");
    },
  });
};

export const useJoinEventChatMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const shared = createEventMutations(eventsApi, queryClient).joinChat(eventId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Joined the event chat");
    },
  });
};

export const useInviteEventParticipantMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const shared = createEventMutations(eventsApi, queryClient).inviteParticipant(eventId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Invite sent");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useBanEventParticipantMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const shared = createEventMutations(eventsApi, queryClient).banParticipant(eventId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Participant removed and banned");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUnbanEventParticipantMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const shared = createEventMutations(eventsApi, queryClient).unbanParticipant(eventId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Participant unbanned");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
