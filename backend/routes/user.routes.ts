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
  getAllUsers,
  getUsersFromSameUniversity,
  updateBio,
  getUserByName,
  savePostController,
} from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import {
  updateBioSchema,
  followSchema,
  unfollowSchema,
} from "../schemas/user.schema.js";
import { imageUpload } from "../lib/imageUpload.js";

const router = express.Router();

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.get("/users-by-name/:name", getUserByName);
router.get("/followers/:id", getFollowers);
router.get("/following/:id", getFollowing);
router.patch("/update-bio", validate({ body: updateBioSchema }), updateBio);
router.get("/follows-user/:id", followsUser);
router.get("/users-from-same-university", getUsersFromSameUniversity);
router.put(
  "/update-profile-image",
  imageUpload.single("image"),
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
