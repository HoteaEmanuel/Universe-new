import axios, { AxiosError } from "axios";
import { create } from "zustand";
import type {
  CreateEventPayload,
  UpdateEventPayload,
  EventDetails,
  EventSummary,
  EventsPage,
  EventParticipant,
  EventParticipantsPage,
  EventParticipantStatus,
  EventBansPage,
} from "../queryAndMutation/types";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const errorMessage = (error: unknown, fallback: string) =>
  (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
  fallback;

type MyEventsScope = "hosting" | "going" | "interested" | "waitlisted";

type EventStore = {
  createEvent: (data: CreateEventPayload) => Promise<EventSummary>;
  getEvent: (id: string) => Promise<EventDetails>;
  updateEvent: (id: string, data: UpdateEventPayload) => Promise<EventSummary>;
  cancelEvent: (id: string) => Promise<EventSummary>;
  updateEventCoverImage: (id: string, image: File) => Promise<unknown>;
  discoverEvents: (cursor?: string) => Promise<EventsPage>;
  getMyEvents: (scope: MyEventsScope, cursor?: string) => Promise<EventsPage>;
  rsvpToEvent: (
    id: string,
    status: "going" | "interested",
  ) => Promise<EventParticipant>;
  cancelRsvp: (id: string) => Promise<void>;
  getEventParticipants: (
    id: string,
    status?: EventParticipantStatus,
    cursor?: string,
  ) => Promise<EventParticipantsPage>;
  joinEventChat: (id: string) => Promise<{ id: string }>;
  downloadEventIcs: (id: string, title: string) => Promise<void>;
  banEventParticipant: (
    id: string,
    userId: string,
    reason?: string,
  ) => Promise<{ message: string }>;
  unbanEventParticipant: (id: string, userId: string) => Promise<{ message: string }>;
  getEventBans: (id: string, cursor?: string) => Promise<EventBansPage>;
};

export const useEventStore = create<EventStore>(() => ({
  createEvent: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/events`, data);
      return response.data.event;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not create event"));
    }
  },
  getEvent: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/events/${id}`);
      return response.data.event;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load event"));
    }
  },
  updateEvent: async (id, data) => {
    try {
      const response = await axios.patch(`${API_URL}/events/${id}`, data);
      return response.data.event;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not update event"));
    }
  },
  cancelEvent: async (id) => {
    try {
      const response = await axios.post(`${API_URL}/events/${id}/cancel`);
      return response.data.event;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not cancel event"));
    }
  },
  updateEventCoverImage: async (id, image) => {
    try {
      const formData = new FormData();
      formData.append("image", image);
      const response = await axios.post(
        `${API_URL}/events/${id}/change-cover-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not update event cover image"));
    }
  },
  discoverEvents: async (cursor) => {
    try {
      const response = await axios.get(`${API_URL}/events/discover`, {
        params: cursor ? { cursor } : undefined,
      });
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load events"));
    }
  },
  getMyEvents: async (scope, cursor) => {
    try {
      const response = await axios.get(`${API_URL}/events/mine`, {
        params: { scope, ...(cursor ? { cursor } : {}) },
      });
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load your events"));
    }
  },
  rsvpToEvent: async (id, status) => {
    try {
      const response = await axios.post(`${API_URL}/events/${id}/rsvp`, { status });
      return response.data.participant;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not save RSVP"));
    }
  },
  cancelRsvp: async (id) => {
    try {
      await axios.delete(`${API_URL}/events/${id}/rsvp`);
    } catch (error) {
      throw new Error(errorMessage(error, "Could not remove RSVP"));
    }
  },
  getEventParticipants: async (id, status, cursor) => {
    try {
      const response = await axios.get(`${API_URL}/events/${id}/participants`, {
        params: { ...(status ? { status } : {}), ...(cursor ? { cursor } : {}) },
      });
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load participants"));
    }
  },
  joinEventChat: async (id) => {
    try {
      const response = await axios.post(`${API_URL}/events/${id}/join-chat`);
      return response.data.group;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not join event chat"));
    }
  },
  downloadEventIcs: async (id, title) => {
    try {
      const response = await axios.get(`${API_URL}/events/${id}/calendar.ics`, {
        responseType: "blob",
      });
      const objectUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${title}.ics`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      throw new Error(errorMessage(error, "Could not download calendar file"));
    }
  },
  banEventParticipant: async (id, userId, reason) => {
    try {
      const response = await axios.post(
        `${API_URL}/events/${id}/participants/${userId}/ban`,
        { reason },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not ban participant"));
    }
  },
  unbanEventParticipant: async (id, userId) => {
    try {
      const response = await axios.delete(`${API_URL}/events/${id}/bans/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not unban participant"));
    }
  },
  getEventBans: async (id, cursor) => {
    try {
      const response = await axios.get(`${API_URL}/events/${id}/bans`, {
        params: cursor ? { cursor } : undefined,
      });
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load banned users"));
    }
  },
}));
