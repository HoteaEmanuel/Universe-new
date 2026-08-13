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
const usersSocket = {};

const activePostUsers={};

const activeConversationUsers={};

export function getReceiverSocketId(userId) {
  return usersSocket[userId];
}

export const getActivePostUsers=(postId)=>{
  console.log(postId);
  return activePostUsers[postId];
}

export const getActiveConversationUsers=(convoId)=>{
  return activeConversationUsers[convoId];
}
io.on("connection", (socket) => {
  console.log("A user connected " + socket.id);
  const userId = socket.handshake.query.userId;
  
  if (userId) {
    usersSocket[userId] = socket.id;
  }

  socket.on("view_post",(postId)=>{
    console.log("NEW USER ON THE POST");
    if(!activePostUsers[postId]) {
      activePostUsers[postId]=new Set();
      activePostUsers[postId].add(postId);

    }
    else activePostUsers[postId].add(userId);
    console.log("ACTIVE USERS FOR POST ID : " ,postId);
    console.log(activePostUsers[postId]);
  });

  socket.on("leave_post",(postId)=>{
    console.log("LEFT POST");
    activePostUsers[postId]?.delete(userId);
  })



  socket.on("view_conversation",(id,userId)=>{
    if(!activeConversationUsers[id])
    {
      activeConversationUsers[id]=new Set();
      activeConversationUsers[id].add(userId)
    }
    else activeConversationUsers[id].add(userId);
    console.log("ACTIVE USERS ON CONVERSATION\n");
    console.log(activeConversationUsers[id]);
  })

  socket.on("leave_conversation",(id,userId)=>{
    if(!activeConversationUsers[id]) return;
    activeConversationUsers[id].delete(userId);

      console.log("ACTIVE USERS ON CONVERSATION\n");
      console.log(activeConversationUsers[id]);
  })

  socket.on("typing",({ id, userId, name })=>{
    const activeUsers = activeConversationUsers[id];
    if(!activeUsers) return;
    activeUsers.forEach((memberId)=>{
      if(memberId===userId) return;
      const receiverSocketId = getReceiverSocketId(memberId);
      if(receiverSocketId) io.to(receiverSocketId).emit("userTyping",{ id, userId, name });
    });
  })

  socket.on("stopTyping",({ id, userId })=>{
    const activeUsers = activeConversationUsers[id];
    if(!activeUsers) return;
    activeUsers.forEach((memberId)=>{
      if(memberId===userId) return;
      const receiverSocketId = getReceiverSocketId(memberId);
      if(receiverSocketId) io.to(receiverSocketId).emit("userStoppedTyping",{ id, userId });
    });
  })

  io.emit("getOnlineUsers", Object.keys(usersSocket));
  socket.on("disconnect", () => {
    console.log("A user disconnected " + socket.id);
    if (userId) delete usersSocket[userId];
    io.emit("getOnlineUsers", Object.keys(usersSocket));
  });
});
export { io, app, server };
