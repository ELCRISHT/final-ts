import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import Room from "../models/Room.js";

const router = express.Router();

// Get all rooms (or user's rooms for teachers)
router.get("/", protectRoute, async (req, res) => {
  try {
    const query = req.user.role === "teacher" 
      ? { createdBy: req.user._id }
      : {}; // Students can see all rooms
    
    const rooms = await Room.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName profilePic");
    
    const roomsWithCreatorName = rooms.map(room => ({
      ...room.toObject(),
      createdByName: room.createdBy?.fullName || "Unknown"
    }));
    
    res.json(roomsWithCreatorName);
  } catch (error) {
    console.error("Error in getRooms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new room (teachers only)
router.post("/create", protectRoute, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create rooms" });
    }

    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Room name is required" });
    }

    const room = await Room.create({
      name: name.trim(),
      createdBy: req.user._id,
    });

    await room.populate("createdBy", "fullName profilePic");

    res.status(201).json({
      ...room.toObject(),
      createdByName: room.createdBy.fullName
    });
  } catch (error) {
    console.error("Error in createRoom:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a room (creator only)
router.delete("/:roomId", protectRoute, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own rooms" });
    }

    await Room.findByIdAndDelete(roomId);
    
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error in deleteRoom:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get room details
router.get("/:roomId", protectRoute, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.findById(roomId).populate("createdBy", "fullName profilePic");
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({
      ...room.toObject(),
      createdByName: room.createdBy?.fullName || "Unknown"
    });
  } catch (error) {
    console.error("Error in getRoomDetails:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
