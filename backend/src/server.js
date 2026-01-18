import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import monitoringRoutes from "./routes/monitoring.route.js"; // 1. Import monitoring routes
import roomRoutes from "./routes/room.route.js"; // Import room routes

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js"; // 2. Import app & server from socket.js

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// 3. Use the imported app (do not use const app = express())
app.use(
  cors({
    origin: ["http://localhost:5173"], // Match the array format in socket.js
    credentials: true, 
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/monitoring", monitoringRoutes); // 4. Register the monitoring route
app.use("/api/rooms", roomRoutes); // Register room routes

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// 5. Change app.listen -> server.listen
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});