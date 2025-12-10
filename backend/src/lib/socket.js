import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // 1. UPDATE: Allow your production URL and localhost
    origin: [
      "http://localhost:5173",
      "https://your-app-name.onrender.com", // <--- REPLACE with your actual deployed URL
      // OR use "*" to allow ALL connections (easiest for debugging)
      "*" 
    ],
    // 2. Ensure credentials and methods are allowed
    credentials: true,
    methods: ["GET", "POST"]
  },
});

// Store online users: { userId: socketId }
const userSocketMap = {}; 

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // --- MONITORING EVENTS ---

  // 1. Join the specific call room
  socket.on("join_call", (callId) => {
    socket.join(callId);
    console.log(`User joined call room: ${callId}`);
  });

  // 2. LISTEN for student events and BROADCAST to the room
  socket.on("monitoring:event", (data) => {
    console.log("Received monitoring event:", data); // Add logging to debug
    // Broadcast to everyone in the room (Teacher will receive this)
    io.to(data.callId).emit("monitoring:update", data);
  });

  // -------------------------

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
  });
});

export { io, app, server };