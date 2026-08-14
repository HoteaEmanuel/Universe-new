import express from "express";
import {
  getPreferences,
  updatePreferences,
} from "../controllers/preferences.controller.js";
import { validate } from "../middleware/validate.js";
import { updatePreferencesSchema } from "../schemas/preferences.schema.js";

const router = express.Router();

router.get("/preferences", getPreferences);
router.patch(
  "/preferences",
  validate({ body: updatePreferencesSchema }),
  updatePreferences,
);

export default router;
