import { Router } from "express";
import { requireAdmin } from "../middleware/authorization.js";
import { validate } from "../middleware/validate.js";
import { blockUserSchema, listUsersQuerySchema } from "../schemas/admin.schema.js";
import {
  getStats,
  getDailyActivity,
  getTopUniversities,
  listUsers,
  blockUser,
  unblockUser,
} from "../controllers/admin.controller.js";

const router = Router();

// verifyToken is already applied globally to every /api/* route mounted
// after it in app.ts, so only the admin-role check is needed here.
router.get("/stats", requireAdmin, getStats);
router.get("/stats/daily-activity", requireAdmin, getDailyActivity);
router.get("/stats/top-universities", requireAdmin, getTopUniversities);
router.get("/users", requireAdmin, validate({ query: listUsersQuerySchema }), listUsers);
router.post(
  "/users/:id/block",
  requireAdmin,
  validate({ body: blockUserSchema }),
  blockUser,
);
router.post("/users/:id/unblock", requireAdmin, unblockUser);

export default router;
