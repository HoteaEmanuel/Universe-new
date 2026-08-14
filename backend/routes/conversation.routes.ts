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
  startConversationSchema,
  sendMessageSchema,
  editMessageSchema,
  messagesQuerySchema,
  mediaQuerySchema,
} from "../schemas/conversation.schema.js";
const router = express.Router();
router.get("/", getConversationsController);
router.get("/users", getConvoUsers);
router.get("/:id", getConvoById);
router.get(
  "/messages/:id",
  validate({ query: messagesQuerySchema }),
  getMessages,
);
router.get(
  "/:id/messages",
  validate({ query: messagesQuerySchema }),
  getMessages,
);
router.get(
  "/:id/media",
  validate({ query: mediaQuerySchema }),
  getConvoMediaController,
);
router.get("/:id/user", getConvoUser);
router.get("/user/:id", getConversationByUserIds);

router.delete("/delete-messages/:id", deleteMessageController);
router.patch(
  "/edit-messages/:id",
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
  imageUpload.any(),
  validate({ body: sendMessageSchema }),
  sendMessageController,
);
export default router;
