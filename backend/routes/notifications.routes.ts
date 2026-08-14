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
import { idParamSchema } from "../schemas/notification.schema.js";
router.use(rateLimiter);
router.use(validate({ params: idParamSchema }));
router.get("/notifications/:id", getUserNotifications);

router.get("/unread-notifications/:id", getUnreadNotifications);

router.get("/unread-message-notifications/:id", getUnreadMessageNotifications);
router.post("/seen-notifications/:id", seeNotifications);
router.post("/see-new-messages/:id", seeNewConversationMessages);
router.post("/delete-notifications/:id", deleteNotifications);

export default router;
