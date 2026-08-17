import express from "express";
import {
  getMessages,
  getConvoMediaController,
  getConversationByUserIds,
  getConvoById,
  getConvoUser,
  startConversationController,
  getConvoUsers,
  sendMessageController,
  sendFilesMessageController,
  sendVoiceMessageController,
  editMessageController,
  deleteMessageController,
  getConversationsController,
  reactToMessageController,
  markConversationReadController,
} from "../controllers/conversation.controller.js";
import { imageUpload } from "../lib/imageUpload.js";
import { audioUpload } from "../lib/audioUpload.js";
import { fileUpload } from "../lib/fileUpload.js";
import { messageRateLimiter } from "../middleware/messageRateLimiter.js";
import { validate } from "../middleware/validate.js";
import {
  requireConversationParticipant,
  requireConversationMessageOwner,
  requireConversationMessageParticipant,
} from "../middleware/authorization.js";
import {
  startConversationSchema,
  sendMessageSchema,
  sendVoiceMessageSchema,
  editMessageSchema,
  messagesQuerySchema,
  mediaQuerySchema,
  reactToMessageSchema,
} from "../schemas/conversation.schema.js";
const router = express.Router();

router.get("/", getConversationsController);
router.get("/users", getConvoUsers);
router.get("/:id", requireConversationParticipant, getConvoById);
router.get(
  "/messages/:id",
  requireConversationParticipant,
  validate({ query: messagesQuerySchema }),
  getMessages,
);
router.get(
  "/:id/messages",
  requireConversationParticipant,
  validate({ query: messagesQuerySchema }),
  getMessages,
);
router.get(
  "/:id/media",
  requireConversationParticipant,
  validate({ query: mediaQuerySchema }),
  getConvoMediaController,
);
router.get("/:id/user", requireConversationParticipant, getConvoUser);
router.get("/user/:id", getConversationByUserIds);
router.post("/:id/read", requireConversationParticipant, markConversationReadController);

router.delete(
  "/delete-messages/:id",
  requireConversationMessageOwner,
  deleteMessageController,
);
router.patch(
  "/edit-messages/:id",
  requireConversationMessageOwner,
  validate({ body: editMessageSchema }),
  editMessageController,
);
router.post(
  "/react-message/:id",
  requireConversationMessageParticipant,
  validate({ body: reactToMessageSchema }),
  reactToMessageController,
);
router.post(
  "/start-conversation/:id",
  messageRateLimiter,
  validate({ body: startConversationSchema }),
  startConversationController,
);
router.post(
  "/:id/send-message",
  requireConversationParticipant,
  messageRateLimiter,
  imageUpload.any(),
  validate({ body: sendMessageSchema }),
  sendMessageController,
);
router.post(
  "/:id/send-files-message",
  requireConversationParticipant,
  messageRateLimiter,
  fileUpload.array("files", 10),
  validate({ body: sendMessageSchema }),
  sendFilesMessageController,
);
router.post(
  "/:id/send-voice-message",
  requireConversationParticipant,
  messageRateLimiter,
  audioUpload.single("audio"),
  validate({ body: sendVoiceMessageSchema }),
  sendVoiceMessageController,
);
export default router;
