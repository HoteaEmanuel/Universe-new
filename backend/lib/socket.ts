import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { findBlockEitherDirection } from "../repository/block.repository.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
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
// private messages/notifications via getReceiverSocketId.
io.use((socket, next) => {
  try {
    const bearerToken = socket.handshake.auth?.token as string | undefined;
    const cookieToken = parseCookies(
      socket.handshake.headers.cookie,
    ).accessToken;
    const token = bearerToken || cookieToken;
    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, process.env.JWT_KEY as string) as {
      userId: string;
    };
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
});

const usersSocket: Record<string, string> = {};

const activePostUsers: Record<string, Set<string>> = {};

const activeConversationUsers: Record<string, Set<string>> = {};

export function getReceiverSocketId(userId: string) {
  return usersSocket[userId];
}

export const getActivePostUsers = (postId: string) => {
  return activePostUsers[postId];
};

export const getActiveConversationUsers = (convoId: string) => {
  return activeConversationUsers[convoId];
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

  io.emit("getOnlineUsers", Object.keys(usersSocket));
  socket.on("disconnect", () => {
    delete usersSocket[userId];
    io.emit("getOnlineUsers", Object.keys(usersSocket));
  });
});
export { io, app, server };
