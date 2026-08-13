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
import multer from "multer";
const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.get("/users-by-name/:name", getUserByName);
router.get("/followers/:id", getFollowers);
router.get("/following/:id", getFollowing);
router.patch("/update-bio", updateBio);
router.get("/follows-user/:id", followsUser);
router.get("/users-from-same-university", getUsersFromSameUniversity);
router.put("/update-profile-image", upload.single("image"), updateUserImage);
router.post("/posts/save/:id", savePostController);
router.post("/posts/unsave/:id", unsavePost);
router.post("/follow", followController);
router.post("/unfollow", unfollowController);

export default router;
