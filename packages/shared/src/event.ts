import type { EventStatus, EventType, EventVisibility, EventParticipantStatus } from "./domain.js";
import type { EventPerson } from "./user.js";
import type { NamedCursorPage } from "./pagination.js";

export type EventHostGroup = {
  id: string;
  name: string;
  coverImageUrl?: string | null;
};

export type EventSummary = {
  id: string;
  creatorId: string;
  creator: EventPerson;
  hostGroupId?: string | null;
  hostGroup?: EventHostGroup | null;
  title: string;
  description?: string | null;
  location?: string | null;
  virtualUrl?: string | null;
  coverImageUrl?: string | null;
  coverImageKey?: string | null;
  startAt: string;
  endAt?: string | null;
  visibility: EventVisibility;
  capacity?: number | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  status: EventStatus;
  eventType: EventType;
  coordinationGroup?: { id: string } | null;
  announcementPost?: { id: string } | null;
};

export type EventParticipantCounts = Record<EventParticipantStatus, number>;

export type EventParticipant = {
  id: string;
  eventId: string;
  userId: string;
  status: EventParticipantStatus;
  createdAt: string;
  updatedAt: string;
};

export type EventDetails = EventSummary & {
  counts: EventParticipantCounts;
  viewerParticipation: EventParticipant | null;
};

export type EventsPage = NamedCursorPage<"events", EventSummary>;

export type EventParticipantWithUser = EventParticipant & { user: EventPerson };

export type EventParticipantsPage = NamedCursorPage<"items", EventParticipantWithUser>;

export type EventBan = {
  id: string;
  eventId: string;
  userId: string;
  bannedByUserId: string | null;
  reason?: string | null;
  createdAt: string;
  user: EventPerson;
  bannedBy: EventPerson | null;
};

export type EventBansPage = NamedCursorPage<"items", EventBan>;

export type CreateEventPayload = {
  title: string;
  description?: string;
  location?: string;
  virtualUrl?: string;
  startAt: string;
  endAt?: string;
  visibility?: EventVisibility;
  capacity?: number;
  hostGroupId?: string;
};

export type UpdateEventPayload = Partial<
  Omit<CreateEventPayload, "visibility" | "hostGroupId">
>;
