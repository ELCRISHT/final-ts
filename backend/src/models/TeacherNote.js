import mongoose from "mongoose";

const teacherNoteSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    callId: { type: String, required: true },
    note: { type: String, required: true },
  },
  { timestamps: true }
);

const TeacherNote = mongoose.model("TeacherNote", teacherNoteSchema);
export default TeacherNote;