import express from "express";
import {
  blockUserController,
  unblockUserController,
  getBlockedUsersController,
} from "../controllers/block.controller.js";
import { validate } from "../middleware/validate.js";
import { blockUserSchema } from "../schemas/block.schema.js";

const router = express.Router();

router.get("/", getBlockedUsersController);
router.post("/block", validate({ body: blockUserSchema }), blockUserController);
router.post("/unblock", validate({ body: blockUserSchema }), unblockUserController);

export default router;
