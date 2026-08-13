import express from "express";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
import {
  createGroupController,
  deleteGroup,
  getUserGroups,
  getGroupById,
  getGroupMessages,
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
const router = express.Router();
router.post("/", createGroupController);
router.delete("/:id", deleteGroup);
router.get("/user/:userId", getUserGroups);
router.get("/discover/public", getDiscoverableGroupsController);
router.get("/:id", getGroupById);
router.get("/:id/members", getGroupMembers);
router.get("/:id/auth-user", getGroupMemberById);
router.get("/:id/messages", getGroupMessages);
router.get(
  "/:id/users-from-same-university-not-in-group",
  getUsersFromSameUniversityNotInGroup,
);
router.get("/:id/check-admin/:userId", checkUserIsAdmin);
router.post("/:id/add-member", addMemberToGroupController);

router.use(rateLimiter);
router.post(
  "/:id/send-message",
  upload.any(),
  sendMessageToGroupController,
);
router.patch("/edit-message/:messageId", editMessageController);
router.post("/delete-message/:messageId", deleteMessageController);
router.post("/:id/make-admin/:userId", makeUserAdminController);
router.post("/:id/leave-group", leaveGroup);
router.post("/:id/kick-member/:userId", kickMemberFromGroup);
router.post(
  "/:id/change-group-image",
  upload.single("image"),
  updateGroupCoverImageController,
);

router.get('/active-users/:id',getActiveGroupUsersOnConversation);
export default router;
