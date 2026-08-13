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
const router = express.Router();
router.get("/posts/:id/comments", getComments);
router.get("/posts/:id/comments-count", getCommentsCount);
router.post("/posts/:id/send-comment", rateLimiter, sendCommentController);
router.post("/posts/:id/like-comment", likeCommentController);
router.post("/posts/:id/remove-like-comment", removeLikeCommentController);
router.delete("/posts/:id/delete-comment", deleteComment);
export default router;
