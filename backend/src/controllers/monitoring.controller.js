import MonitoringEvent from "../models/MonitoringEvent.js";
import TeacherNote from "../models/TeacherNote.js";
import User from "../models/User.js";

export const saveEvent = async (req, res) => {
  try {
    const { callId, eventType, details, timestamp } = req.body;
    const event = await MonitoringEvent.create({
      student: req.user._id,
      callId,
      eventType,
      details,
      timestamp: timestamp || Date.now(),
    });
    res.status(201).json(event);
  } catch (error) {
    console.error("Error saving monitoring event:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCallEvents = async (req, res) => {
  try {
    const { callId } = req.params;
    const events = await MonitoringEvent.find({ callId })
      .populate("student", "fullName profilePic")
      .sort({ timestamp: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const saveNote = async (req, res) => {
  try {
    const { studentId, callId, note } = req.body;
    const newNote = await TeacherNote.create({
      teacher: req.user._id,
      student: studentId,
      callId,
      note,
    });
    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error saving note:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getReportData = async (req, res) => {
  try {
    const { studentId, callId } = req.params;
    
    const [events, notes, student] = await Promise.all([
      MonitoringEvent.find({ student: studentId, callId }).sort({ timestamp: 1 }),
      TeacherNote.find({ student: studentId, callId }).sort({ createdAt: -1 }),
      User.findById(studentId).select("-password")
    ]);

    res.status(200).json({ student, events, notes });
  } catch (error) {
    console.error("Error generating report data:", error);
    res.status(500).json({ message: "Server error" });
  }
};