import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createReportSchema } from "../schemas/report.schema.js";
import { createReportController } from "../controllers/report.controller.js";

const router = Router();

// verifyToken is already applied globally to every /api/* route mounted
// after it in app.ts, so no auth middleware is re-applied here.
router.post("/", validate({ body: createReportSchema }), createReportController);

export default router;
