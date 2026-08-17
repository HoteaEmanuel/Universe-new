import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEventStore } from "../../store/eventStore";
import type { CreateEventPayload, UpdateEventPayload } from "../types";

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();
  const { createEvent } = useEventStore();
  return useMutation({
    mutationFn: (data: CreateEventPayload) => createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-discover"] });
      queryClient.invalidateQueries({ queryKey: ["events-mine"] });
      toast.success("Event created");
    },
  });
};

export const useUpdateEventMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { updateEvent } = useEventStore();
  return useMutation({
    mutationFn: (data: UpdateEventPayload) => updateEvent(eventId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events-discover"] });
      queryClient.invalidateQueries({ queryKey: ["events-mine"] });
      toast.success("Event updated");
    },
  });
};

export const useCancelEventMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { cancelEvent } = useEventStore();
  return useMutation({
    mutationFn: () => cancelEvent(eventId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events-discover"] });
      queryClient.invalidateQueries({ queryKey: ["events-mine"] });
      toast.success("Event cancelled");
    },
  });
};

export const useUpdateEventCoverImageMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { updateEventCoverImage } = useEventStore();
  return useMutation({
    mutationFn: (image: File) => updateEventCoverImage(eventId as string, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      toast.success("Event cover image updated");
    },
  });
};

export const useRsvpEventMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { rsvpToEvent } = useEventStore();
  return useMutation({
    mutationFn: (status: "going" | "interested") =>
      rsvpToEvent(eventId as string, status),
    onSuccess: (participant) => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events-mine"] });
      queryClient.invalidateQueries({ queryKey: ["event-participants", eventId] });
      toast.success(
        participant.status === "waitlisted"
          ? "You're on the waitlist"
          : participant.status === "going"
            ? "You're going!"
            : "Marked as interested",
      );
    },
  });
};

export const useCancelRsvpMutation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { cancelRsvp } = useEventStore();
  return useMutation({
    mutationFn: () => cancelRsvp(eventId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events-mine"] });
      queryClient.invalidateQueries({ queryKey: ["event-participants", eventId] });
      toast.success("RSVP removed");
    },
  });
};

export const useJoinEventChatMutation = (eventId?: string) => {
  const { joinEventChat } = useEventStore();
  return useMutation({
    mutationFn: () => joinEventChat(eventId as string),
    onSuccess: () => {
      toast.success("Joined the event chat");
    },
  });
};
