import express from "express";
import {
  getMessages,
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
import multer from "multer";
import { rateLimiter } from "../middleware/rateLimiter.js";
const upload = multer({ dest: "uploads/" });
const router = express.Router();
router.get("/", getConversationsController);
router.get("/users", getConvoUsers);
router.get("/:id", getConvoById);
router.get("/messages/:id", getMessages);
router.get("/:id/messages", getMessages);
router.get("/:id/user", getConvoUser);
router.get("/user/:id", getConversationByUserIds);

router.delete("/delete-messages/:id", deleteMessageController);
router.patch("/edit-messages/:id", editMessageController);
router.use(rateLimiter);
router.post("/start-conversation/:id", startConversationController);
router.post("/:id/send-message", upload.any(), sendMessageController);
export default router;
