import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://your-app-name.onrender.com",
      "*" 
    ],
    credentials: true,
    methods: ["GET", "POST"]
  },
});

// Store online users: { userId: socketId }
const userSocketMap = {}; 

// Store user info for peer visibility
const userInfoMap = {};

// Store peer status for each call
const callPeerStatus = {};

export function getReceiverSocketId(uid) {
  return userSocketMap[uid];
}

// Get all users in a specific room
export function getUsersInRoom(roomId) {
  const room = io.sockets.adapter.rooms.get(roomId);
  if (!room) return [];
  
  const users = [];
  room.forEach(socketId => {
    const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socketId);
    if (userId) users.push(userId);
  });
  return users;
}

// Get user info with status for a call
export function getPeersInCall(callId, excludeuserId = null) {
  const usersInRoom = getUsersInRoom(callId);
  const callStatus = callPeerStatus[callId] || {};
  
  return usersInRoom
    .filter(uid => uid !== excludeuserId)
    .map(uid => ({
      userId: uid,
      ...userInfoMap[uid],
      ...(callStatus[uid] || { status: 'focused' })
    }));
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  const userName = socket.handshake.query.userName;
  const userImage = socket.handshake.query.userImage;
  const userRole = socket.handshake.query.userRole;

  if (userId) {
    userSocketMap[userId] = socket.id;
    userInfoMap[userId] = { name: userName, image: userImage, role: userRole };
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // --- CALL ROOM EVENTS ---

  socket.on("join_call", (data) => {
    const callId = typeof data === 'string' ? data : data.callId;
    socket.join(callId);
    console.log(`User ${userId} joined call room: ${callId}`);
    
    // Initialize peer status
    if (!callPeerStatus[callId]) {
      callPeerStatus[callId] = {};
    }
    callPeerStatus[callId][userId] = { status: 'focused', lastActivity: 'Joined' };
    
    // Notify all users
    const usersInRoom = getUsersInRoom(callId);
    io.to(callId).emit("room:users_updated", {
      callId,
      userCount: usersInRoom.length,
      users: usersInRoom
    });

    // System chat message
    io.to(callId).emit("chat:system", {
      message: `${userName || 'Someone'} joined the call`
    });

    // Peer status update
    io.to(callId).emit("peer:status_update", {
      studentId: userId,
      studentName: userName,
      studentImage: userImage,
      status: 'focused',
      lastActivity: 'Joined session'
    });
  });

  // --- MONITORING EVENTS ---

  socket.on("monitoring:event", (data) => {
    console.log("Received monitoring event:", data);
    
    if (callPeerStatus[data.callId]) {
      const status = (data.eventType === 'focus' || data.eventType === 'comply') ? 'focused' : 'distracted';
      callPeerStatus[data.callId][data.studentId] = { 
        status, 
        lastActivity: data.details || data.eventType 
      };
    }

    io.to(data.callId).emit("monitoring:update", data);

    io.to(data.callId).emit("peer:status_update", {
      studentId: data.studentId,
      studentName: data.studentName,
      studentImage: data.studentImage,
      status: (data.eventType === 'focus' || data.eventType === 'comply') ? 'focused' : 'distracted',
      lastActivity: data.details || data.eventType
    });
  });

  // --- CHAT EVENTS ---

  socket.on("chat:message", (data) => {
    console.log("Chat message:", data);
    io.to(data.callId).emit("chat:message", data);
  });

  socket.on("chat:typing", (data) => {
    socket.to(data.callId).emit("chat:typing", data);
  });

  socket.on("chat:stopTyping", (data) => {
    socket.to(data.callId).emit("chat:stopTyping", data);
  });

  // --- PEER VISIBILITY ---

  socket.on("peer:request_status", (data) => {
    const { callId, userId: requestingUser } = data;
    const peers = getPeersInCall(callId, requestingUser);
    
    peers.forEach(peer => {
      socket.emit("peer:status_update", {
        studentId: peer.userId,
        studentName: peer.name,
        studentImage: peer.image,
        status: peer.status || 'focused',
        lastActivity: peer.lastActivity || 'Active'
      });
    });
  });

  // --- DISCONNECT ---

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    
    const rooms = Array.from(socket.rooms);
    rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        if (callPeerStatus[roomId] && callPeerStatus[roomId][userId]) {
          delete callPeerStatus[roomId][userId];
        }

        io.to(roomId).emit("user:left", { userId, callId: roomId });
        io.to(roomId).emit("peer:left", { userId });
        io.to(roomId).emit("chat:system", { message: `${userName || 'Someone'} left the call` });
        
        const usersInRoom = getUsersInRoom(roomId);
        io.to(roomId).emit("room:users_updated", {
          callId: roomId,
          userCount: usersInRoom.length,
          users: usersInRoom
        });
      }
    });
    
    delete userSocketMap[userId];
    delete userInfoMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
