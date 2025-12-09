import mongoose from "mongoose";

const monitoringEventSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    callId: { type: String, required: true },
    eventType: {
      type: String,
      enum: ["distraction", "focus", "tab_switch", "window_blur", "warning", "comply"],
      required: true,
    },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MonitoringEvent = mongoose.model("MonitoringEvent", monitoringEventSchema);
export default MonitoringEvent;