import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { connectToDatabase } from "./database/connectDb.js";
import authRouter from "./routes/auth.routes.js";
import postRouter from "./routes/post.routes.js";
import publicRouter from "./routes/public.routes.js";
import commentsRouter from "./routes/comments.routes.js";
import conversationRouter from "./routes/conversation.routes.js";
import blockRouter from "./routes/block.routes.js";
import newsApiRouter from "./routes/news.routes.js";
import groupRouter from "./routes/group.routes.js";
import eventRouter from "./routes/event.routes.js";
import pollRouter from "./routes/poll.routes.js";
import searchRouter from "./routes/search.routes.js";
import aiRouter from "./routes/aiRoutes.js";
import notificationRouter from "./routes/notifications.routes.js";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import preferencesRouter from "./routes/preferences.routes.js";
import { app, server } from "./lib/socket.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { verifyToken } from "./middleware/verifyToken.js";
import { loadBlockedIds } from "./middleware/loadBlockedIds.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { startBlockedAccountEmailSweep } from "./jobs/blockedAccountEmailSweep.js";
import adminRouter from "./routes/admin.routes.js";
import reportRouter from "./routes/report.routes.js";
dotenv.config();
import passport from "passport";
import "./config/passport.js";
// Only trust the X-Forwarded-For header when actually deployed behind a
// real reverse proxy (Render) - trusting it on a direct connection would let
// a client set its own header and defeat the rate limiter's IP key.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
// Same origin list lib/socket.ts's Socket.IO CORS uses - kept in sync so
// the REST API and the realtime connection agree on which origins the web
// client is allowed to call from.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.NODE_ENV !== "production" ? "http://localhost:5173" : undefined,
].filter((origin): origin is string => Boolean(origin));

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/api/auth", rateLimiter, authRouter);
app.use("/api/public", publicRouter);
app.use("/api", verifyToken, loadBlockedIds);
app.use("/api", postRouter);
app.use("/api", userRouter);
app.use("/api", preferencesRouter);
app.use("/api", commentsRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api/blocks", blockRouter);
app.use("/api", newsApiRouter);
app.use("/api/groups", groupRouter);
app.use("/api/events", eventRouter);
app.use("/api/polls", pollRouter);
app.use("/api/search", searchRouter);
app.use("/api", aiRouter);
app.use("/api", notificationRouter);
app.use("/api/reports", reportRouter);
app.use("/api/admin", adminRouter);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
  connectToDatabase();
  startBlockedAccountEmailSweep();
});
