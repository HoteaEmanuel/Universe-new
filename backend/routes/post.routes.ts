import express from "express";
const router = express.Router();
import {
  getUserPostsController,
  getSavedPostsController,
  getSearchedPostsController,
  getPostUser,
  getLikes,
  userHasLiked,
  getPost,
  updatePostController,
  deletePostController,
  checkSaved,
  getRelatedPosts,
  getUsersWhoLikedPost,
  deletePostsByName,
  getPostsController,
  likePostController,
  unlikePostController,
  createPostController,
  getPostsByTagController,
} from "../controllers/post.controller.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
router.get("/post/:id", getPost);
router.get("/posts/:feed", getPostsController);
router.get("/post-user/:id", getPostUser);
router.get("/user-posts/:id", getUserPostsController);
router.get("/saved-posts/:id", getSavedPostsController);
router.get("/check-saved/:id", checkSaved);
router.get("/related-posts/:tag", getRelatedPosts);
router.get("/likes/:id", getLikes);
router.get("/users-who-liked/:id", getUsersWhoLikedPost);

router.post("/like-post", likePostController);
router.post("/unlike-post", unlikePostController);
router.get("/user-liked/:id", userHasLiked);
router.post("/posts", upload.array("images"), createPostController);
router.patch("/posts/:id", upload.array("images"), updatePostController);
router.delete("/posts/:id", deletePostController);
router.get("/posts-by-name/:name", getSearchedPostsController);
router.get("/posts-by-tag/:tag", getPostsByTagController);

router.post("/delete-posts", deletePostsByName);

export default router;
