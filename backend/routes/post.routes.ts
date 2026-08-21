import express from "express";
const router = express.Router();
import {
  getUserPostsController,
  getSavedPostsController,
  getSearchedPostsController,
  getPostUser,
  getLikes,
  getRelevantLiker,
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
  getPostsTags,
  getShareRecipientsController,
  sharePostController,
} from "../controllers/post.controller.js";
import { imageUpload } from "../lib/imageUpload.js";
import { verifyUploadedFiles } from "../lib/validateUpload.js";
import { validate } from "../middleware/validate.js";
import { requirePostOwner } from "../middleware/authorization.js";
import { messageRateLimiter } from "../middleware/messageRateLimiter.js";
import {
  createPostSchema,
  updatePostSchema,
  postIdSchema,
  deletePostsByNameSchema,
  feedQuerySchema,
  usersWhoLikedQuerySchema,
  sharePostSchema,
} from "../schemas/post.schema.js";

router.get("/post/:id", getPost);
router.get("/posts/tags", getPostsTags);
router.get("/share-recipients", getShareRecipientsController);
router.post(
  "/post/:id/share",
  messageRateLimiter,
  validate({ body: sharePostSchema }),
  sharePostController,
);
router.get(
  "/posts/:feed",
  validate({ query: feedQuerySchema }),
  getPostsController,
);
router.get("/post-user/:id", getPostUser);
router.get("/user-posts/:id", getUserPostsController);
router.get("/saved-posts/:id", getSavedPostsController);
router.get("/check-saved/:id", checkSaved);
router.get("/related-posts/:tag", getRelatedPosts);
router.get("/likes/:id", getLikes);
router.get("/relevant-liker/:id", getRelevantLiker);
router.get(
  "/users-who-liked/:id",
  validate({ query: usersWhoLikedQuerySchema }),
  getUsersWhoLikedPost,
);

router.post(
  "/like-post",
  validate({ body: postIdSchema }),
  likePostController,
);
router.post(
  "/unlike-post",
  validate({ body: postIdSchema }),
  unlikePostController,
);
router.get("/user-liked/:id", userHasLiked);
router.post(
  "/posts",
  imageUpload.array("images"),
  verifyUploadedFiles("image"),
  validate({ body: createPostSchema }),
  createPostController,
);
router.patch(
  "/posts/:id",
  requirePostOwner,
  imageUpload.array("images"),
  verifyUploadedFiles("image"),
  validate({ body: updatePostSchema }),
  updatePostController,
);
router.delete("/posts/:id", requirePostOwner, deletePostController);
router.get("/posts-by-name/:name", getSearchedPostsController);

router.post(
  "/delete-posts",
  validate({ body: deletePostsByNameSchema }),
  deletePostsByName,
);

export default router;
