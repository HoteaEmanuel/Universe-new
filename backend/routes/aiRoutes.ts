import router from "express";
import { generateHashtags, listModels } from "../controllers/aiController.js";
import { validate } from "../middleware/validate.js";
import { generateHashtagsSchema } from "../schemas/ai.schema.js";

const aiRouter = router.Router();
aiRouter.post(
  "/ai/hashtags",
  validate({ body: generateHashtagsSchema }),
  generateHashtags,
);
aiRouter.get("/ai/models", listModels);
export default aiRouter;
