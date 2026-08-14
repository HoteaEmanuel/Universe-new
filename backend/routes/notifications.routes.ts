import express from "express";
import {
  deleteNotifications,
  getUnreadMessageNotifications,
  getUnreadNotifications,
  getUserNotifications,
  seeNewConversationMessages,
  seeNotifications,
} from "../controllers/notifications.controller.js";
const router = express.Router();
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { requireSelf } from "../middleware/authorization.js";
import { idParamSchema } from "../schemas/notification.schema.js";
router.use(rateLimiter);
router.use(validate({ params: idParamSchema }));
router.get("/notifications/:id", requireSelf("id"), getUserNotifications);

router.get(
  "/unread-notifications/:id",
  requireSelf("id"),
  getUnreadNotifications,
);

router.get(
  "/unread-message-notifications/:id",
  requireSelf("id"),
  getUnreadMessageNotifications,
);
router.post("/seen-notifications/:id", requireSelf("id"), seeNotifications);
// :id here is a conversationId, not a userId — seeNewConversationMessages already
// scopes its update by req.userId internally, so no requireSelf check applies.
router.post("/see-new-messages/:id", seeNewConversationMessages);
router.post(
  "/delete-notifications/:id",
  requireSelf("id"),
  deleteNotifications,
);

export default router;
