import express from "express";
import { getPublicPostController } from "../controllers/public.controller.js";

const router = express.Router();

router.get("/post/:id", getPublicPostController);

export default router;
