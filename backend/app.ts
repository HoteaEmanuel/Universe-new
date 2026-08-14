import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectToDatabase } from "./database/connectDb.js";
import authRouter from "./routes/auth.routes.js";
import postRouter from "./routes/post.routes.js";
import commentsRouter from "./routes/comments.routes.js";
import conversationRouter from "./routes/conversation.routes.js";
import newsApiRouter from "./routes/news.routes.js";
import groupRouter from "./routes/group.routes.js";
import searchRouter from "./routes/search.routes.js";
import aiRouter from "./routes/aiRoutes.js";
import notificationRouter from "./routes/notifications.routes.js";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import userRouter from "./routes/user.routes.js";
import preferencesRouter from "./routes/preferences.routes.js";
import { app, server } from "./lib/socket.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { verifyToken } from "./middleware/verifyToken.js";
import { errorHandler } from "./middleware/errorHandler.js";
dotenv.config();
import passport from "passport";
import "./config/passport.js";
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudApiKey = process.env.CLOUDINARY_API_KEY;
const cloudSecretKey = process.env.CLOUDINARY_SECRET_KEY;
cloudinary.config({
  cloud_name: cloudName,
  api_key: cloudApiKey,
  api_secret: cloudSecretKey,
});
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/api/auth", rateLimiter, authRouter);
app.use("/api", verifyToken);
app.use("/api", postRouter);
app.use("/api", userRouter);
app.use("/api", preferencesRouter);
app.use("/api", commentsRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api", newsApiRouter);
app.use("/api/groups", groupRouter);
app.use("/api/search", searchRouter);
app.use("/api", aiRouter);
app.use("/api", notificationRouter);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
  connectToDatabase();
});
