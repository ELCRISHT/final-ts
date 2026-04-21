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

// ── Student dashboard stats ──────────────────────────────────────────────────
export const getMyStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    const allEvents = await MonitoringEvent.find({ student: studentId });

    // Count unique sessions by unique callIds
    const uniqueSessions = new Set(allEvents.map((e) => e.callId)).size;

    // Count distraction events
    const distractionTypes = ["tab_switch", "window_blur", "phone_usage", "distraction"];
    const totalDistractions = allEvents.filter((e) => distractionTypes.includes(e.eventType)).length;

    // Count warnings
    const totalWarnings = allEvents.filter((e) => e.eventType === "warning").length;

    // Compute focus rate
    const focusEvents = allEvents.filter(
      (e) => e.eventType === "focus" || e.eventType === "comply"
    ).length;
    const totalRelevant = allEvents.filter((e) => e.details !== "Student Joined Session").length;
    const focusRate = totalRelevant > 0 ? Math.round((focusEvents / totalRelevant) * 100) : 100;

    res.status(200).json({
      sessionsJoined: uniqueSessions,
      totalDistractions,
      totalWarnings,
      focusRate: `${focusRate}%`,
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};