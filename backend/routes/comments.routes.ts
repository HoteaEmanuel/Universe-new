import express from "express";
import {
  deleteComment,
  getComments,
  getCommentsCount,
  likeCommentController,
  removeLikeCommentController,
  sendCommentController,
} from "../controllers/comment.controller.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { requireCommentOwner } from "../middleware/authorization.js";
import { commentQuerySchema, sendCommentSchema } from "../schemas/comment.schema.js";
const router = express.Router();
router.get(
  "/posts/:id/comments",
  validate({ query: commentQuerySchema }),
  getComments,
);
router.get("/posts/:id/comments-count", getCommentsCount);
router.post(
  "/posts/:id/send-comment",
  rateLimiter,
  validate({ body: sendCommentSchema }),
  sendCommentController,
);
router.post("/posts/:id/like-comment", likeCommentController);
router.post("/posts/:id/remove-like-comment", removeLikeCommentController);
router.delete(
  "/posts/:id/delete-comment",
  requireCommentOwner,
  deleteComment,
);
export default router;
