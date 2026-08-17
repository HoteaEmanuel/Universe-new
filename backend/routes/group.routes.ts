import express from "express";
import { imageUpload } from "../lib/imageUpload.js";
import { audioUpload } from "../lib/audioUpload.js";
import { fileUpload } from "../lib/fileUpload.js";
import {
  createGroupController,
  deleteGroup,
  getUserGroups,
  getGroupById,
  getGroupMessages,
  getGroupMediaController,
  sendMessageToGroupController,
  sendFilesMessageToGroupController,
  sendVoiceMessageToGroupController,
  sendPollMessageToGroupController,
  getGroupMemberById,
  getUsersFromSameUniversityNotInGroup,
  getGroupMembers,
  leaveGroup,
  kickMemberFromGroup,
  checkUserIsAdmin,
  editMessageController,
  deleteMessageController,
  makeUserAdminController,
  updateGroupCoverImageController,
  addMemberToGroupController,
  getActiveGroupUsersOnConversation,
  getDiscoverableGroupsController,
  reactToGroupMessageController,
} from "../controllers/group.controller.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { messageRateLimiter } from "../middleware/messageRateLimiter.js";
import { validate } from "../middleware/validate.js";
import {
  requireGroupMembership,
  requireGroupAdmin,
  requireGroupMessageOwner,
  requireGroupMessageMembership,
  requireSelf,
} from "../middleware/authorization.js";
import {
  createGroupSchema,
  addMemberToGroupSchema,
  sendGroupMessageSchema,
  sendGroupVoiceMessageSchema,
  editGroupMessageSchema,
  groupMessagesQuerySchema,
  groupMediaQuerySchema,
  reactToGroupMessageSchema,
} from "../schemas/group.schema.js";
import { sendGroupPollMessageSchema } from "../schemas/poll.schema.js";
const router = express.Router();

const groupActionRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  keyFn: (req) => req.userId ?? req.socket.remoteAddress ?? "unknown",
  message: "You're doing that too quickly. Please wait a moment and try again.",
});

router.post("/", validate({ body: createGroupSchema }), createGroupController);
router.delete("/:id", requireGroupAdmin, deleteGroup);
router.get("/user/:userId", requireSelf("userId"), getUserGroups);
router.get("/discover/public", getDiscoverableGroupsController);
router.get("/:id", requireGroupMembership, getGroupById);
router.get("/:id/members", requireGroupMembership, getGroupMembers);
router.get("/:id/auth-user", getGroupMemberById);
router.get(
  "/:id/messages",
  requireGroupMembership,
  validate({ query: groupMessagesQuerySchema }),
  getGroupMessages,
);
router.get(
  "/:id/media",
  requireGroupMembership,
  validate({ query: groupMediaQuerySchema }),
  getGroupMediaController,
);
router.get(
  "/:id/users-from-same-university-not-in-group",
  requireGroupMembership,
  getUsersFromSameUniversityNotInGroup,
);
router.get(
  "/:id/check-admin/:userId",
  requireGroupMembership,
  checkUserIsAdmin,
);
router.post(
  "/:id/add-member",
  validate({ body: addMemberToGroupSchema }),
  addMemberToGroupController,
);

router.post(
  "/:id/send-message",
  requireGroupMembership,
  messageRateLimiter,
  imageUpload.any(),
  validate({ body: sendGroupMessageSchema }),
  sendMessageToGroupController,
);
router.post(
  "/:id/send-files-message",
  requireGroupMembership,
  messageRateLimiter,
  fileUpload.array("files", 10),
  validate({ body: sendGroupMessageSchema }),
  sendFilesMessageToGroupController,
);
router.post(
  "/:id/send-voice-message",
  requireGroupMembership,
  messageRateLimiter,
  audioUpload.single("audio"),
  validate({ body: sendGroupVoiceMessageSchema }),
  sendVoiceMessageToGroupController,
);
router.post(
  "/:id/send-poll-message",
  requireGroupMembership,
  messageRateLimiter,
  validate({ body: sendGroupPollMessageSchema }),
  sendPollMessageToGroupController,
);
router.use(groupActionRateLimiter);
router.patch(
  "/edit-message/:messageId",
  requireGroupMessageOwner,
  validate({ body: editGroupMessageSchema }),
  editMessageController,
);
router.post(
  "/delete-message/:messageId",
  requireGroupMessageOwner,
  deleteMessageController,
);
router.post(
  "/react-message/:messageId",
  requireGroupMessageMembership,
  validate({ body: reactToGroupMessageSchema }),
  reactToGroupMessageController,
);
router.post("/:id/make-admin/:userId", requireGroupAdmin, makeUserAdminController);
router.post("/:id/leave-group", leaveGroup);
router.post("/:id/kick-member/:userId", requireGroupAdmin, kickMemberFromGroup);
router.post(
  "/:id/change-group-image",
  requireGroupAdmin,
  imageUpload.single("image"),
  updateGroupCoverImageController,
);

router.get(
  "/active-users/:id",
  requireGroupMembership,
  getActiveGroupUsersOnConversation,
);
export default router;
