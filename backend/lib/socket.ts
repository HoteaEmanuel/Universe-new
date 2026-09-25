import http from "http";
import express from "express";
import { Server } from "socket.io";
import { findBlockEitherDirection } from "../repository/block.repository.js";
import { getBidirectionalBlockedIds } from "./blockCache.js";
import { verifyAuthToken } from "./authTokens.js";

const app = express();
const server = http.createServer(app);

// Same origin list app.ts's CORS middleware uses - kept in sync so the web
// client can't connect from an origin the REST API itself would reject.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.NODE_ENV !== "production" ? "http://localhost:5173" : undefined,
].filter((origin): origin is string => Boolean(origin));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Socket.IO handshakes bypass Express middleware, so cookie-parser never
// runs here - parse the raw Cookie header ourselves for the (unsigned)
// accessToken cookie the web client relies on.
const parseCookies = (header?: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const pair of header.split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
};

// Every connection must present a valid access token - either an explicit
// bearer token (mobile) or the httpOnly accessToken cookie (web). Without
// this, any client could claim to be any userId and read that user's
// private messages/notifications via getReceiverSocketId. Must specifically
// be an access token: refresh tokens live for 30 days instead of 15 minutes,
// so accepting one here would hand a stolen/leaked refresh token a much
// longer-lived way to open a live session than it was ever meant to have.
io.use((socket, next) => {
  const bearerToken = socket.handshake.auth?.token as string | undefined;
  const cookieToken = parseCookies(
    socket.handshake.headers.cookie,
  ).accessToken;
  const token = bearerToken || cookieToken;
  if (!token) return next(new Error("Unauthorized"));

  const decoded = verifyAuthToken(token, "access");
  if (!decoded) return next(new Error("Unauthorized"));

  socket.data.userId = decoded.userId;
  next();
});

const usersSocket: Record<string, string> = {};

const activePostUsers: Record<string, Set<string>> = {};

const activeConversationUsers: Record<string, Set<string>> = {};

export function getReceiverSocketId(userId: string) {
  return usersSocket[userId];
}

// A blocked user's existing socket stays authenticated until its access
// token naturally expires (up to 15 min) - this cuts that window short so a
// just-blocked user stops receiving/sending real-time messages immediately,
// matching the REST API's per-request blocked-account check.
export function disconnectUserSockets(userId: string) {
  const socketId = usersSocket[userId];
  if (socketId) io.sockets.sockets.get(socketId)?.disconnect(true);
}

export const getActivePostUsers = (postId: string) => {
  return activePostUsers[postId];
};

export const getActiveConversationUsers = (convoId: string) => {
  return activeConversationUsers[convoId];
};

// A plain io.emit told every connected user who else is online, including
// someone who blocked them or was blocked by them - exactly the presence
// info blocking is supposed to hide. Each viewer gets their own
// block-filtered copy instead of one shared broadcast.
const broadcastOnlineUsers = () => {
  const onlineIds = Object.keys(usersSocket);
  for (const [viewerId, socketId] of Object.entries(usersSocket)) {
    getBidirectionalBlockedIds(viewerId)
      .then((blockedIds) => {
        const visibleIds = onlineIds.filter((id) => !blockedIds.has(id));
        io.to(socketId).emit("getOnlineUsers", visibleIds);
      })
      .catch((error) => {
        console.error(`Failed to compute online users for ${viewerId}:`, error);
      });
  }
};

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  usersSocket[userId] = socket.id;

  socket.on("view_post", (postId: string) => {
    if (!activePostUsers[postId]) {
      activePostUsers[postId] = new Set();
    }
    activePostUsers[postId].add(userId);
  });

  socket.on("leave_post", (postId: string) => {
    activePostUsers[postId]?.delete(userId);
  });

  socket.on("view_conversation", (id: string) => {
    if (!activeConversationUsers[id]) {
      activeConversationUsers[id] = new Set();
    }
    activeConversationUsers[id].add(userId);
  });

  socket.on("leave_conversation", (id: string) => {
    activeConversationUsers[id]?.delete(userId);
  });

  socket.on("typing", async ({ id, name }: { id: string; name: string }) => {
    const activeUsers = activeConversationUsers[id];
    if (!activeUsers) return;
    for (const memberId of activeUsers) {
      if (memberId === userId) continue;
      // Blocking stops sending socket typing information
      if (await findBlockEitherDirection(userId, memberId)) continue;
      const receiverSocketId = getReceiverSocketId(memberId);
      if (receiverSocketId)
        io.to(receiverSocketId).emit("userTyping", { id, userId, name });
    }
  });

  socket.on("stopTyping", async ({ id }: { id: string }) => {
    const activeUsers = activeConversationUsers[id];
    if (!activeUsers) return;
    for (const memberId of activeUsers) {
      if (memberId === userId) continue;
      // Blocking stops sending socket typing information
      if (await findBlockEitherDirection(userId, memberId)) continue;
      const receiverSocketId = getReceiverSocketId(memberId);
      if (receiverSocketId)
        io.to(receiverSocketId).emit("userStoppedTyping", { id, userId });
    }
  });

  broadcastOnlineUsers();
  socket.on("disconnect", () => {
    delete usersSocket[userId];

    // Without this, a user who just closes the tab (rather than clicking
    // "leave") stays "active" on whatever post/conversation they were
    // viewing forever - they'd never be notified of new comments/messages
    // there again, since the notification path treats "active" as "already
    // seeing it live" and skips creating a notification.
    for (const [postId, viewers] of Object.entries(activePostUsers)) {
      viewers.delete(userId);
      if (viewers.size === 0) delete activePostUsers[postId];
    }
    for (const [convoId, viewers] of Object.entries(activeConversationUsers)) {
      viewers.delete(userId);
      if (viewers.size === 0) delete activeConversationUsers[convoId];
    }

    broadcastOnlineUsers();
  });
});
export { io, app, server };
