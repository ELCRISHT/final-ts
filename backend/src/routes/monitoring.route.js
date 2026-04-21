import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { saveEvent, getCallEvents, saveNote, getReportData, getMyStats } from "../controllers/monitoring.controller.js";

const router = express.Router();

router.post("/event", protectRoute, saveEvent);
router.get("/call/:callId", protectRoute, getCallEvents);
router.post("/notes", protectRoute, saveNote);
router.get("/report/:studentId/:callId", protectRoute, getReportData);
router.get("/my-stats", protectRoute, getMyStats); // Student dashboard stats

export default router;