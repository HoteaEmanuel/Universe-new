import express from "express";
import { getNews, getTopNews } from "../controllers/news.controller.js";
import { validate } from "../middleware/validate.js";
import { newsCategoryParamSchema } from "../schemas/news.schema.js";
const router = express.Router();
router.get(
  "/news/:category",
  validate({ params: newsCategoryParamSchema }),
  getNews,
);
router.get("/top-news", getTopNews);

export default router;
