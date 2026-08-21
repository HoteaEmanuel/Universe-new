import express from "express";
import {
  updateUserImage,
  unsavePost,
  followController,
  unfollowController,
  getUserById,
  followsUser,
  getFollowers,
  getFollowing,
  getRelevantFollowers,
  getRelevantFollowing,
  getUniversityPeople,
  getAllUsers,
  mentionSearchUsers,
  getUsersFromSameUniversity,
  updateBio,
  getUserByUsername,
  checkUsernameAvailability,
  updateUsername,
  savePostController,
} from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import {
  updateBioSchema,
  followSchema,
  unfollowSchema,
  followListQuerySchema,
  updateUsernameSchema,
  usernameAvailabilityQuerySchema,
  mentionSearchQuerySchema,
} from "../schemas/user.schema.js";
import { imageUpload } from "../lib/imageUpload.js";
import { verifyUploadedFiles } from "../lib/validateUpload.js";

const router = express.Router();

router.get("/users", getAllUsers);
router.get(
  "/users/mention-search",
  validate({ query: mentionSearchQuerySchema }),
  mentionSearchUsers,
);
router.get("/users/:id", getUserById);
router.get("/u/:username", getUserByUsername);
router.get(
  "/username-availability",
  validate({ query: usernameAvailabilityQuerySchema }),
  checkUsernameAvailability,
);
router.patch(
  "/username",
  validate({ body: updateUsernameSchema }),
  updateUsername,
);
router.get("/followers/:id", getFollowers);
router.get("/following/:id", getFollowing);
router.get(
  "/followers-relevant/:id",
  validate({ query: followListQuerySchema }),
  getRelevantFollowers,
);
router.get(
  "/following-relevant/:id",
  validate({ query: followListQuerySchema }),
  getRelevantFollowing,
);
router.get(
  "/university-people",
  validate({ query: followListQuerySchema }),
  getUniversityPeople,
);
router.patch("/update-bio", validate({ body: updateBioSchema }), updateBio);
router.get("/follows-user/:id", followsUser);
router.get("/users-from-same-university", getUsersFromSameUniversity);
router.put(
  "/update-profile-image",
  imageUpload.single("image"),
  verifyUploadedFiles("image"),
  updateUserImage,
);
router.post("/posts/save/:id", savePostController);
router.post("/posts/unsave/:id", unsavePost);
router.post("/follow", validate({ body: followSchema }), followController);
router.post(
  "/unfollow",
  validate({ body: unfollowSchema }),
  unfollowController,
);

export default router;
