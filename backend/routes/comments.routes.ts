import express from "express";
import {
  deleteComment,
  getComments,
  getCommentReplies,
  getCommentsCount,
  likeCommentController,
  removeLikeCommentController,
  sendCommentController,
} from "../controllers/comment.controller.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { requireCommentOwner } from "../middleware/authorization.js";
import {
  commentQuerySchema,
  replyParamsSchema,
  sendCommentSchema,
} from "../schemas/comment.schema.js";
const router = express.Router();

const commentRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyFn: (req) => req.userId ?? req.socket.remoteAddress ?? "unknown",
  message: "You're commenting too quickly. Please wait a moment and try again.",
});
router.get(
  "/posts/:id/comments",
  validate({ query: commentQuerySchema }),
  getComments,
);
router.get(
  "/posts/:id/comments/:commentId/replies",
  validate({ params: replyParamsSchema, query: commentQuerySchema }),
  getCommentReplies,
);
router.get("/posts/:id/comments-count", getCommentsCount);
router.post(
  "/posts/:id/send-comment",
  commentRateLimiter,
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
