import {
  createEvent,
  findEventById,
  updateEvent,
  cancelEvent,
  setEventCoverImage,
  setEventCoordinationGroupId,
  createEventAnnouncementPost,
  findDiscoverableEvents,
  findMyEvents,
  findEventParticipant,
  countGoingParticipants,
  countParticipantsByStatus,
  deleteEventParticipant,
  acquireEventParticipant,
  findOldestWaitlistedParticipant,
  findEventParticipantsPage,
  findAllActiveParticipantUserIds,
  banEventParticipant,
  deleteEventBan,
  findEventBansPage,
  EventBannedError,
} from "../repository/event.repository.js";
import {
  findGroupMember,
  createGroupMember,
  acquireGroupMember,
  GroupBannedError,
} from "../repository/group-members.repository.js";
import { createGroup } from "../repository/group.repository.js";
import { getFollowConnectedUserIds } from "../repository/relevance.repository.js";
import {
  createNotification,
  emitNewNotification,
} from "../repository/notification.repository.js";
import { uploadImage, deleteImages } from "../lib/storage.js";
import { buildIcsCalendar } from "../lib/ics.js";
import type {
  EventVisibility,
  EventParticipantStatus,
} from "../generated/prisma/client.js";
import type { EventStatus, EventType } from "../types/shared.js";

export { EventBannedError };

type UploadedImage = Express.Multer.File;
type EventWithRelations = NonNullable<Awaited<ReturnType<typeof findEventById>>>;

export const deriveEventStatus = (event: {
  cancelledAt: Date | null;
  startAt: Date;
  endAt: Date | null;
}): EventStatus => {
  if (event.cancelledAt) return "cancelled";
  const now = Date.now();
  const effectiveEnd = (event.endAt ?? event.startAt).getTime();
  if (now < event.startAt.getTime()) return "upcoming";
  if (now <= effectiveEnd) return "ongoing";
  return "completed";
};

export const deriveEventType = (creator: {
  accountType: string;
  identityVerified: string;
}): EventType => {
  return creator.accountType === "business" && creator.identityVerified === "true"
    ? "official"
    : "community";
};

export const toEventDTO = (event: EventWithRelations) => ({
  ...event,
  status: deriveEventStatus(event),
  eventType: deriveEventType(event.creator),
});

interface CreateEventServiceInput {
  creatorId: string;
  hostGroupId?: string;
  title: string;
  description?: string;
  location?: string;
  virtualUrl?: string;
  startAt: Date;
  endAt?: Date;
  visibility?: EventVisibility;
  capacity?: number;
}

export const createEventService = async (data: CreateEventServiceInput) => {
  const { creatorId, hostGroupId } = data;

  if (hostGroupId) {
    const member = await findGroupMember(hostGroupId, creatorId);
    if (!member || member.role !== "admin") {
      throw new Error("Only group admins can host an event as this group");
    }
  }

  const event = await createEvent(data);

  // A private event cannot have an announcement post - it would leak an
  // event the visibility rules say is hidden into the public feed.
  if (event.visibility === "public") {
    await createEventAnnouncementPost(event);
  }

  const created = await findEventById(event.id);
  return toEventDTO(created as EventWithRelations);
};

const isEventHost = async (
  event: Pick<EventWithRelations, "creatorId" | "hostGroupId">,
  userId: string,
) => {
  if (event.creatorId === userId) return true;
  if (!event.hostGroupId) return false;
  const member = await findGroupMember(event.hostGroupId, userId);
  return member?.role === "admin";
};

// A private event has no invite list - the unguessable eventId link is
// itself the access control, and rsvpEventService deliberately stays
// ungated so a link recipient can RSVP their way into "participant" status.
// This gate protects everything *past* that front door: the full detail
// view, the participant list, and the calendar export all require already
// being the host or an existing participant.
const assertEventVisible = async (
  event: Pick<EventWithRelations, "id" | "visibility" | "creatorId" | "hostGroupId">,
  viewerId: string,
) => {
  if (event.visibility !== "private") return;
  if (await isEventHost(event, viewerId)) return;
  const participant = await findEventParticipant(event.id, viewerId);
  if (!participant) throw new Error("This event is private");
};

export const getEventService = async (eventId: string, viewerId: string) => {
  const event = await findEventById(eventId);
  if (!event) throw new Error("Event not found");
  await assertEventVisible(event, viewerId);

  const [counts, viewerParticipation] = await Promise.all([
    countParticipantsByStatus(eventId),
    findEventParticipant(eventId, viewerId),
  ]);

  return { ...toEventDTO(event), counts, viewerParticipation };
};

interface UpdateEventServiceInput {
  title?: string;
  description?: string;
  location?: string;
  virtualUrl?: string;
  startAt?: Date;
  endAt?: Date;
  capacity?: number;
}

export const updateEventService = async (eventId: string, data: UpdateEventServiceInput) => {
  const before = await findEventById(eventId);
  if (!before) throw new Error("Event not found");

  const updated = await updateEvent(eventId, data);

  const timeOrLocationChanged =
    (data.startAt && data.startAt.getTime() !== before.startAt.getTime()) ||
    (data.endAt && data.endAt.getTime() !== (before.endAt?.getTime() ?? -1)) ||
    (data.location !== undefined && data.location !== before.location) ||
    (data.virtualUrl !== undefined && data.virtualUrl !== before.virtualUrl);

  if (timeOrLocationChanged) {
    await notifyParticipants(eventId, updated.creatorId, {
      type: "event-update",
      title: "Event updated",
      message: `${updated.title} was updated - check the new details.`,
    });
  }

  return toEventDTO(updated);
};

export const cancelEventService = async (eventId: string) => {
  const event = await cancelEvent(eventId);
  await notifyParticipants(eventId, event.creatorId, {
    type: "event-cancelled",
    title: "Event cancelled",
    message: `${event.title} has been cancelled.`,
  });
  return toEventDTO(event);
};

const notifyParticipants = async (
  eventId: string,
  actionUserId: string,
  payload: { type: "event-update" | "event-cancelled"; title: string; message: string },
) => {
  const participantUserIds = await findAllActiveParticipantUserIds(eventId);
  await Promise.all(
    participantUserIds.map(async (userId) => {
      const notification = await createNotification({
        userId,
        actionUserId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
      });
      await emitNewNotification(userId, notification);
    }),
  );
};

export const updateEventCoverImageService = async (data: { image?: UploadedImage; eventId: string }) => {
  const { image, eventId } = data;
  if (!image?.buffer) throw new Error("No image provided");

  const event = await findEventById(eventId);
  if (!event) throw new Error("Event not found");

  const uploaded = await uploadImage({ buffer: image.buffer, mimeType: image.mimetype, folder: "event_covers" });
  await setEventCoverImage(eventId, uploaded.url, uploaded.key);

  if (event.coverImageKey) {
    deleteImages([event.coverImageKey]).catch(() => {});
  }
};

export const discoverEventsService = async (viewerId: string, cursor: string | undefined, limit: number) => {
  const connectedUserIds = Array.from(await getFollowConnectedUserIds(viewerId));
  const { items, nextCursor, hasMore } = await findDiscoverableEvents({ connectedUserIds, cursor, limit });
  return { events: items.map(toEventDTO), nextCursor, hasMore };
};

export const myEventsService = async (
  userId: string,
  scope: "hosting" | "going" | "interested" | "waitlisted",
  cursor: string | undefined,
  limit: number,
) => {
  const { items, nextCursor, hasMore } = await findMyEvents({ userId, scope, cursor, limit });
  return { events: items.map(toEventDTO), nextCursor, hasMore };
};

export const rsvpEventService = async (
  eventId: string,
  userId: string,
  requestedStatus: "going" | "interested",
) => {
  const event = await findEventById(eventId);
  if (!event) throw new Error("Event not found");
  if (deriveEventStatus(event) === "cancelled") throw new Error("This event has been cancelled");

  let status: EventParticipantStatus = requestedStatus;
  if (requestedStatus === "going" && event.capacity) {
    const existing = await findEventParticipant(eventId, userId);
    const alreadyGoing = existing?.status === "going";
    const goingCount = await countGoingParticipants(eventId);
    if (!alreadyGoing && goingCount >= event.capacity) {
      status = "waitlisted";
    }
  }

  const participant = await acquireEventParticipant(eventId, userId, status);
  return participant;
};

export const cancelRsvpService = async (eventId: string, userId: string) => {
  const existing = await findEventParticipant(eventId, userId);
  if (!existing) return;

  await deleteEventParticipant(eventId, userId);

  if (existing.status !== "going") return;

  const promoted = await findOldestWaitlistedParticipant(eventId);
  if (!promoted) return;

  try {
    await acquireEventParticipant(eventId, promoted.userId, "going");
  } catch (error) {
    // The waitlisted user was banned in between being waitlisted and being
    // promoted - leave the spot open rather than handing them a participant
    // row (or falling through to the next waitlisted person, which would
    // need its own retry loop for a rare edge case).
    if (error instanceof EventBannedError) return;
    throw error;
  }

  const event = await findEventById(eventId);
  const notification = await createNotification({
    userId: promoted.userId,
    actionUserId: userId,
    type: "event-waitlist-promoted",
    title: "You're off the waitlist!",
    message: `A spot opened up for ${event?.title ?? "an event"} - you're going.`,
  });
  await emitNewNotification(promoted.userId, notification);
};

export const getEventParticipantsService = async (
  eventId: string,
  viewerId: string,
  status: EventParticipantStatus | undefined,
  cursor: string | undefined,
  limit: number,
) => {
  const event = await findEventById(eventId);
  if (!event) throw new Error("Event not found");
  await assertEventVisible(event, viewerId);

  return findEventParticipantsPage({ eventId, status, cursor, limit });
};

export const joinEventChatService = async (eventId: string, userId: string) => {
  const event = await findEventById(eventId);
  if (!event) throw new Error("Event not found");

  const isHost = event.creatorId === userId;
  const participant = await findEventParticipant(eventId, userId);
  if (!isHost && !participant) {
    throw new Error("You must RSVP to the event before joining its chat");
  }

  let groupId = event.coordinationGroup?.id;
  if (!groupId) {
    const group = await createGroup({ name: `${event.title} - Chat`, visibility: "private" });
    await createGroupMember({ groupId: group.id, userId, role: "admin" });
    await setEventCoordinationGroupId(eventId, group.id);
    return group;
  }

  const existingMember = await findGroupMember(groupId, userId);
  if (!existingMember) {
    try {
      await acquireGroupMember({ groupId, userId, role: "member" });
    } catch (error) {
      if (error instanceof GroupBannedError) {
        throw new Error("You've been removed from this event's chat and can't rejoin");
      }
      throw error;
    }
  }
  return { id: groupId };
};

export const buildEventIcsService = async (eventId: string, viewerId: string) => {
  const event = await findEventById(eventId);
  if (!event) throw new Error("Event not found");
  await assertEventVisible(event, viewerId);
  return buildIcsCalendar(event);
};

export const banEventParticipantService = async (
  eventId: string,
  targetUserId: string,
  bannedByUserId: string,
  reason: string | undefined,
) => {
  const event = await findEventById(eventId);
  if (!event) throw new Error("Event not found");
  if (await isEventHost(event, targetUserId)) {
    throw new Error("Event hosts can't be banned - remove their host access first");
  }

  const ban = await banEventParticipant({
    eventId,
    userId: targetUserId,
    bannedByUserId,
    reason,
    coordinationGroupId: event.coordinationGroup?.id,
  });

  const notification = await createNotification({
    userId: targetUserId,
    actionUserId: bannedByUserId,
    type: "event-banned",
    title: "Removed from event",
    message: `You were removed from ${event.title} and can no longer rejoin.`,
  });
  await emitNewNotification(targetUserId, notification);

  return ban;
};

export const unbanEventParticipantService = async (eventId: string, targetUserId: string) => {
  await deleteEventBan(eventId, targetUserId);
};

export const getEventBansService = async (
  eventId: string,
  cursor: string | undefined,
  limit: number,
) => {
  return findEventBansPage({ eventId, cursor, limit });
};
