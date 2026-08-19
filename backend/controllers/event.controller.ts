import type { Request, Response } from "express";
import type {} from "multer";
import {
  createEventService,
  getEventService,
  updateEventService,
  cancelEventService,
  updateEventCoverImageService,
  discoverEventsService,
  myEventsService,
  rsvpEventService,
  cancelRsvpService,
  getEventParticipantsService,
  joinEventChatService,
  buildEventIcsService,
  banEventParticipantService,
  unbanEventParticipantService,
  getEventBansService,
  EventBannedError,
} from "../services/event.service.js";
import type {
  DiscoverEventsQueryInput,
  MyEventsQueryInput,
  EventParticipantsQueryInput,
  BanEventParticipantInput,
  EventBansQueryInput,
} from "../schemas/event.schema.js";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export const createEventController = async (req: Request, res: Response) => {
  try {
    const event = await createEventService({ ...req.body, creatorId: req.userId as string });
    return res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getEventController = async (req: Request, res: Response) => {
  try {
    const event = await getEventService(req.params.id as string, req.userId as string);
    return res.status(200).json({ event });
  } catch (error) {
    return res.status(404).json({ message: errorMessage(error) });
  }
};

export const updateEventController = async (req: Request, res: Response) => {
  try {
    const event = await updateEventService(req.params.id as string, req.body);
    return res.status(200).json({ message: "Event updated successfully", event });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const cancelEventController = async (req: Request, res: Response) => {
  try {
    const event = await cancelEventService(req.params.id as string);
    return res.status(200).json({ message: "Event cancelled successfully", event });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const updateEventCoverImageController = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const image = req.file;
    await updateEventCoverImageService({ image, eventId });
    return res.status(200).json({ message: "Updated the event cover image successfully" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const discoverEventsController = async (req: Request, res: Response) => {
  try {
    const { cursor, limit } = req.query as unknown as DiscoverEventsQueryInput;
    const page = await discoverEventsService(req.userId as string, cursor, limit);
    return res.status(200).json(page);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const myEventsController = async (req: Request, res: Response) => {
  try {
    const { cursor, limit, scope } = req.query as unknown as MyEventsQueryInput;
    const page = await myEventsService(req.userId as string, scope, cursor, limit);
    return res.status(200).json(page);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const rsvpEventController = async (req: Request, res: Response) => {
  try {
    const participant = await rsvpEventService(
      req.params.id as string,
      req.userId as string,
      req.body.status,
    );
    return res.status(200).json({ message: "RSVP saved", participant });
  } catch (error) {
    if (error instanceof EventBannedError) {
      return res.status(403).json({ message: errorMessage(error) });
    }
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const cancelRsvpController = async (req: Request, res: Response) => {
  try {
    await cancelRsvpService(req.params.id as string, req.userId as string);
    return res.status(200).json({ message: "RSVP removed" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getEventParticipantsController = async (req: Request, res: Response) => {
  try {
    const { cursor, limit, status } = req.query as unknown as EventParticipantsQueryInput;
    const page = await getEventParticipantsService(
      req.params.id as string,
      req.userId as string,
      status,
      cursor,
      limit,
    );
    return res.status(200).json(page);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const joinEventChatController = async (req: Request, res: Response) => {
  try {
    const group = await joinEventChatService(req.params.id as string, req.userId as string);
    return res.status(200).json({ message: "Joined event chat", group });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getEventCalendarIcsController = async (req: Request, res: Response) => {
  try {
    const ics = await buildEventIcsService(req.params.id as string, req.userId as string);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="event-${req.params.id}.ics"`);
    return res.status(200).send(ics);
  } catch (error) {
    return res.status(404).json({ message: errorMessage(error) });
  }
};

export const banEventParticipantController = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body as BanEventParticipantInput;
    await banEventParticipantService(
      req.params.id as string,
      req.params.userId as string,
      req.userId as string,
      reason,
    );
    return res.status(200).json({ message: "Participant removed and banned" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const unbanEventParticipantController = async (req: Request, res: Response) => {
  try {
    await unbanEventParticipantService(req.params.id as string, req.params.userId as string);
    return res.status(200).json({ message: "Participant unbanned" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getEventBansController = async (req: Request, res: Response) => {
  try {
    const { cursor, limit } = req.query as unknown as EventBansQueryInput;
    const page = await getEventBansService(req.params.id as string, cursor, limit);
    return res.status(200).json(page);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};
