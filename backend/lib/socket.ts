import http from "http";
import express from "express";
import { Server } from "socket.io";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
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
  const userId = socket.handshake.query.userId as string | undefined;

  if (userId) {
    usersSocket[userId] = socket.id;
  }

  socket.on("view_post", (postId: string) => {
    if (!activePostUsers[postId]) {
      activePostUsers[postId] = new Set();
      if (userId) activePostUsers[postId].add(userId);
    } else if (userId) activePostUsers[postId].add(userId);
  });

  socket.on("leave_post", (postId: string) => {
    if (userId) activePostUsers[postId]?.delete(userId);
  });

  socket.on("view_conversation", (id: string, viewerUserId: string) => {
    if (!activeConversationUsers[id]) {
      activeConversationUsers[id] = new Set();
      activeConversationUsers[id].add(viewerUserId);
    } else activeConversationUsers[id].add(viewerUserId);
  });

  socket.on("leave_conversation", (id: string, viewerUserId: string) => {
    if (!activeConversationUsers[id]) return;
    activeConversationUsers[id].delete(viewerUserId);
  });

  socket.on(
    "typing",
    ({ id, userId: typingUserId, name }: { id: string; userId: string; name: string }) => {
      const activeUsers = activeConversationUsers[id];
      if (!activeUsers) return;
      activeUsers.forEach((memberId) => {
        if (memberId === typingUserId) return;
        const receiverSocketId = getReceiverSocketId(memberId);
        if (receiverSocketId)
          io.to(receiverSocketId).emit("userTyping", { id, userId: typingUserId, name });
      });
    },
  );

  socket.on(
    "stopTyping",
    ({ id, userId: typingUserId }: { id: string; userId: string }) => {
      const activeUsers = activeConversationUsers[id];
      if (!activeUsers) return;
      activeUsers.forEach((memberId) => {
        if (memberId === typingUserId) return;
        const receiverSocketId = getReceiverSocketId(memberId);
        if (receiverSocketId)
          io.to(receiverSocketId).emit("userStoppedTyping", { id, userId: typingUserId });
      });
    },
  );

  io.emit("getOnlineUsers", Object.keys(usersSocket));
  socket.on("disconnect", () => {
    if (userId) delete usersSocket[userId];
    io.emit("getOnlineUsers", Object.keys(usersSocket));
  });
});
export { io, app, server };
