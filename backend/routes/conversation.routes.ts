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
  editMessageController,
  deleteMessageController,
  getConversationsController,
} from "../controllers/conversation.controller.js";
import { imageUpload } from "../lib/imageUpload.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import {
  requireConversationParticipant,
  requireConversationMessageOwner,
} from "../middleware/authorization.js";
import {
  startConversationSchema,
  sendMessageSchema,
  editMessageSchema,
  messagesQuerySchema,
  mediaQuerySchema,
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
router.use(rateLimiter);
router.post(
  "/start-conversation/:id",
  validate({ body: startConversationSchema }),
  startConversationController,
);
router.post(
  "/:id/send-message",
  requireConversationParticipant,
  imageUpload.any(),
  validate({ body: sendMessageSchema }),
  sendMessageController,
);
export default router;
