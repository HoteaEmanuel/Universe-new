import express from "express";
const router = express.Router();
import {
  voteOnPollController,
  closePollController,
  getMyPollVoteController,
} from "../controllers/poll.controller.js";
import { validate } from "../middleware/validate.js";
import { voteOnPollSchema } from "../schemas/poll.schema.js";

router.get("/:id/my-vote", getMyPollVoteController);
router.post("/:id/vote", validate({ body: voteOnPollSchema }), voteOnPollController);
router.post("/:id/close", closePollController);

export default router;
