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
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { requireSelf } from "../middleware/authorization.js";
import {
  idParamSchema,
  notificationQuerySchema,
} from "../schemas/notification.schema.js";

const notificationsRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  keyFn: (req) => req.userId ?? req.socket.remoteAddress ?? "unknown",
  message: "Too many requests. Please wait a moment and try again.",
});
router.use(notificationsRateLimiter);

router.get(
  "/notifications/:id",
  validate({ params: idParamSchema, query: notificationQuerySchema }),
  requireSelf("id"),
  getUserNotifications,
);

router.get(
  "/unread-notifications/:id",
  validate({ params: idParamSchema }),
  requireSelf("id"),
  getUnreadNotifications,
);

router.get(
  "/unread-message-notifications/:id",
  validate({ params: idParamSchema }),
  requireSelf("id"),
  getUnreadMessageNotifications,
);
router.post(
  "/seen-notifications/:id",
  validate({ params: idParamSchema }),
  requireSelf("id"),
  seeNotifications,
);
// :id here is a conversationId, not a userId — seeNewConversationMessages already
// scopes its update by req.userId internally, so no requireSelf check applies.
router.post(
  "/see-new-messages/:id",
  validate({ params: idParamSchema }),
  seeNewConversationMessages,
);
router.post(
  "/delete-notifications/:id",
  validate({ params: idParamSchema }),
  requireSelf("id"),
  deleteNotifications,
);

export default router;
