import express from "express";
import {
  getSearchOverviewController,
  searchGroupsController,
  searchPostsController,
  searchUsersController,
} from "../controllers/search.controller.js";
import { validate } from "../middleware/validate.js";
import {
  searchOverviewQuerySchema,
  searchQuerySchema,
} from "../schemas/search.schema.js";

const router = express.Router();

router.get(
  "/",
  validate({ query: searchOverviewQuerySchema }),
  getSearchOverviewController,
);
router.get(
  "/users",
  validate({ query: searchQuerySchema }),
  searchUsersController,
);
router.get(
  "/posts",
  validate({ query: searchQuerySchema }),
  searchPostsController,
);
router.get(
  "/groups",
  validate({ query: searchQuerySchema }),
  searchGroupsController,
);

export default router;
