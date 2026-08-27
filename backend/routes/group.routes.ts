import express from "express";
import { imageUpload } from "../lib/imageUpload.js";
import { audioUpload } from "../lib/audioUpload.js";
import { fileUpload } from "../lib/fileUpload.js";
import { verifyUploadedFiles } from "../lib/validateUpload.js";
import {
  createGroupController,
  deleteGroup,
  getUserGroups,
  getGroupById,
  searchGroupMentionUsersController,
  getGroupMessages,
  getGroupMediaController,
  sendMessageToGroupController,
  sendFilesMessageToGroupController,
  sendVoiceMessageToGroupController,
  sendPollMessageToGroupController,
  getGroupMemberById,
  getUsersFromSameUniversityNotInGroup,
  getGroupMembers,
  getGroupMembersPage,
  leaveGroup,
  kickMemberFromGroup,
  banGroupMemberController,
  unbanGroupMemberController,
  getGroupBansController,
  checkUserIsAdmin,
  editMessageController,
  deleteMessageController,
  makeUserAdminController,
  updateGroupCoverImageController,
  addMemberToGroupController,
  getActiveGroupUsersOnConversation,
  getDiscoverableGroupsController,
  reactToGroupMessageController,
  getCourseCatalogController,
  setGroupCourseTagController,
} from "../controllers/group.controller.js";
import {
  getGroupResourcesController,
  createGroupResourceController,
  updateGroupResourceController,
  deleteGroupResourceController,
  pinGroupResourceController,
  downloadGroupResourceController,
  toggleGroupResourceHelpfulController,
} from "../controllers/groupResource.controller.js";
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
  groupMentionSearchQuerySchema,
  groupMediaQuerySchema,
  reactToGroupMessageSchema,
  setGroupCourseTagSchema,
  discoverGroupsQuerySchema,
  banGroupMemberSchema,
  groupBansQuerySchema,
  groupMembersQuerySchema,
  groupsListQuerySchema,
} from "../schemas/group.schema.js";
import { sendGroupPollMessageSchema } from "../schemas/poll.schema.js";
import {
  createGroupResourceSchema,
  updateGroupResourceSchema,
  groupResourcesQuerySchema,
} from "../schemas/groupResource.schema.js";
const router = express.Router();

const groupActionRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  keyFn: (req) => req.userId ?? req.socket.remoteAddress ?? "unknown",
  message: "You're doing that too quickly. Please wait a moment and try again.",
});

router.post("/", validate({ body: createGroupSchema }), createGroupController);
router.delete("/:id", requireGroupAdmin, deleteGroup);
router.get(
  "/user/:userId",
  requireSelf("userId"),
  validate({ query: groupsListQuerySchema }),
  getUserGroups,
);
router.get("/course-catalog", getCourseCatalogController);
router.get(
  "/discover/public",
  validate({ query: discoverGroupsQuerySchema }),
  getDiscoverableGroupsController,
);
router.patch(
  "/:id/course-tag",
  requireGroupAdmin,
  validate({ body: setGroupCourseTagSchema }),
  setGroupCourseTagController,
);
router.get(
  "/:id/mention-search",
  requireGroupMembership,
  validate({ query: groupMentionSearchQuerySchema }),
  searchGroupMentionUsersController,
);
router.get("/:id", requireGroupMembership, getGroupById);
router.get("/:id/members", requireGroupMembership, getGroupMembers);
router.get(
  "/:id/members/page",
  requireGroupMembership,
  validate({ query: groupMembersQuerySchema }),
  getGroupMembersPage,
);
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
  verifyUploadedFiles("image"),
  validate({ body: sendGroupMessageSchema }),
  sendMessageToGroupController,
);
router.post(
  "/:id/send-files-message",
  requireGroupMembership,
  messageRateLimiter,
  fileUpload.array("files", 10),
  verifyUploadedFiles("file"),
  validate({ body: sendGroupMessageSchema }),
  sendFilesMessageToGroupController,
);
router.post(
  "/:id/send-voice-message",
  requireGroupMembership,
  messageRateLimiter,
  audioUpload.single("audio"),
  verifyUploadedFiles("audio"),
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
  "/:id/members/:userId/ban",
  requireGroupAdmin,
  validate({ body: banGroupMemberSchema }),
  banGroupMemberController,
);
router.get(
  "/:id/bans",
  requireGroupAdmin,
  validate({ query: groupBansQuerySchema }),
  getGroupBansController,
);
router.delete("/:id/bans/:userId", requireGroupAdmin, unbanGroupMemberController);
router.post(
  "/:id/change-group-image",
  requireGroupAdmin,
  imageUpload.single("image"),
  verifyUploadedFiles("image"),
  updateGroupCoverImageController,
);

router.get(
  "/active-users/:id",
  requireGroupMembership,
  getActiveGroupUsersOnConversation,
);

router.get(
  "/:id/resources",
  requireGroupMembership,
  validate({ query: groupResourcesQuerySchema }),
  getGroupResourcesController,
);
router.post(
  "/:id/resources",
  requireGroupMembership,
  fileUpload.single("file"),
  verifyUploadedFiles("file"),
  validate({ body: createGroupResourceSchema }),
  createGroupResourceController,
);
router.patch(
  "/:id/resources/:resourceId",
  requireGroupMembership,
  validate({ body: updateGroupResourceSchema }),
  updateGroupResourceController,
);
router.delete(
  "/:id/resources/:resourceId",
  requireGroupMembership,
  deleteGroupResourceController,
);
router.post(
  "/:id/resources/:resourceId/pin",
  requireGroupAdmin,
  pinGroupResourceController,
);
router.post(
  "/:id/resources/:resourceId/download",
  requireGroupMembership,
  downloadGroupResourceController,
);
router.post(
  "/:id/resources/:resourceId/helpful",
  requireGroupMembership,
  toggleGroupResourceHelpfulController,
);

export default router;
