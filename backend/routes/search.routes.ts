import express from "express";
import {
  getSearchOverviewController,
  searchGroupsController,
  searchPostsController,
  searchUsersController,
} from "../controllers/search.controller.js";

const router = express.Router();

router.get("/", getSearchOverviewController);
router.get("/users", searchUsersController);
router.get("/posts", searchPostsController);
router.get("/groups", searchGroupsController);

export default router;
