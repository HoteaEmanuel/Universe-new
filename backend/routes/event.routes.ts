import express from "express";
import { imageUpload } from "../lib/imageUpload.js";
import { validate } from "../middleware/validate.js";
import { requireEventHost } from "../middleware/authorization.js";
import {
  createEventSchema,
  updateEventSchema,
  rsvpEventSchema,
  discoverEventsQuerySchema,
  myEventsQuerySchema,
  eventParticipantsQuerySchema,
} from "../schemas/event.schema.js";
import {
  createEventController,
  getEventController,
  updateEventController,
  cancelEventController,
  updateEventCoverImageController,
  discoverEventsController,
  myEventsController,
  rsvpEventController,
  cancelRsvpController,
  getEventParticipantsController,
  joinEventChatController,
  getEventCalendarIcsController,
} from "../controllers/event.controller.js";

const router = express.Router();

router.post("/", validate({ body: createEventSchema }), createEventController);
router.get("/discover", validate({ query: discoverEventsQuerySchema }), discoverEventsController);
router.get("/mine", validate({ query: myEventsQuerySchema }), myEventsController);
router.get("/:id", getEventController);
router.patch("/:id", requireEventHost, validate({ body: updateEventSchema }), updateEventController);
router.post("/:id/cancel", requireEventHost, cancelEventController);
router.post(
  "/:id/change-cover-image",
  requireEventHost,
  imageUpload.single("image"),
  updateEventCoverImageController,
);
router.post("/:id/rsvp", validate({ body: rsvpEventSchema }), rsvpEventController);
router.delete("/:id/rsvp", cancelRsvpController);
router.get(
  "/:id/participants",
  validate({ query: eventParticipantsQuerySchema }),
  getEventParticipantsController,
);
router.post("/:id/join-chat", joinEventChatController);
router.get("/:id/calendar.ics", getEventCalendarIcsController);

export default router;
