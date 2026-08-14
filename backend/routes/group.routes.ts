import express from "express";
import { imageUpload } from "../lib/imageUpload.js";
import {
  createGroupController,
  deleteGroup,
  getUserGroups,
  getGroupById,
  getGroupMessages,
  getGroupMediaController,
  sendMessageToGroupController,
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
} from "../controllers/group.controller.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import {
  createGroupSchema,
  addMemberToGroupSchema,
  sendGroupMessageSchema,
  editGroupMessageSchema,
  groupMessagesQuerySchema,
  groupMediaQuerySchema,
} from "../schemas/group.schema.js";
const router = express.Router();
router.post("/", validate({ body: createGroupSchema }), createGroupController);
router.delete("/:id", deleteGroup);
router.get("/user/:userId", getUserGroups);
router.get("/discover/public", getDiscoverableGroupsController);
router.get("/:id", getGroupById);
router.get("/:id/members", getGroupMembers);
router.get("/:id/auth-user", getGroupMemberById);
router.get(
  "/:id/messages",
  validate({ query: groupMessagesQuerySchema }),
  getGroupMessages,
);
router.get(
  "/:id/media",
  validate({ query: groupMediaQuerySchema }),
  getGroupMediaController,
);
router.get(
  "/:id/users-from-same-university-not-in-group",
  getUsersFromSameUniversityNotInGroup,
);
router.get("/:id/check-admin/:userId", checkUserIsAdmin);
router.post(
  "/:id/add-member",
  validate({ body: addMemberToGroupSchema }),
  addMemberToGroupController,
);

router.use(rateLimiter);
router.post(
  "/:id/send-message",
  imageUpload.any(),
  validate({ body: sendGroupMessageSchema }),
  sendMessageToGroupController,
);
router.patch(
  "/edit-message/:messageId",
  validate({ body: editGroupMessageSchema }),
  editMessageController,
);
router.post("/delete-message/:messageId", deleteMessageController);
router.post("/:id/make-admin/:userId", makeUserAdminController);
router.post("/:id/leave-group", leaveGroup);
router.post("/:id/kick-member/:userId", kickMemberFromGroup);
router.post(
  "/:id/change-group-image",
  imageUpload.single("image"),
  updateGroupCoverImageController,
);

router.get("/active-users/:id", getActiveGroupUsersOnConversation);
export default router;
