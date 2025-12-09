import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import { saveTeacherNote, getReportData } from "../lib/api"; // Added getReportData
import { DownloadIcon, UserIcon, AlertTriangleIcon, CheckCircle2, XCircle } from "lucide-react";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

const TeacherMonitoringDashboard = ({ callId }) => {
  const [students, setStudents] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [note, setNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    socket.on("monitoring:update", (data) => {
      setStudents((prev) => {
        const student = prev[data.studentId] || { 
          id: data.studentId, 
          name: data.studentName || "Unknown", 
          image: data.studentImage, 
          status: "focused", 
          warnings: 0, 
          distractions: 0 
        };

        let updates = {};
        if (data.studentName) updates.name = data.studentName;
        if (data.studentImage) updates.image = data.studentImage;

        if (data.eventType === "focus" || data.eventType === "comply") {
            updates.status = "focused";
            updates.lastActivity = data.eventType === "comply" ? "Complied" : "Regained Focus";
        }
        
        if (["distraction", "tab_switch", "window_blur"].includes(data.eventType)) {
          updates.status = "distracted";
          updates.distractions = (student.distractions || 0) + 1;
          updates.lastActivity = data.details || "Distracted";
        }
        
        if (data.eventType === "warning") {
          updates.warnings = (student.warnings || 0) + 1;
          updates.lastActivity = "Warning Threshold";
        }

        return {
          ...prev,
          [data.studentId]: { ...student, ...updates }
        };
      });
    });

    return () => socket.off("monitoring:update");
  }, []);

  const handleSaveNote = async () => {
    if(!selectedStudent || !note.trim()) return;
    try {
      await saveTeacherNote({ studentId: selectedStudent, callId, note });
      setNote("");
      toast.success("Note saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save note");
    }
  };

  const generateReport = async (studentId) => {
    setIsGenerating(true);
    try {
      const reportData = await getReportData(studentId, callId);
      const studentName = reportData.student?.fullName || "Student";
      
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text("Student Engagement Report", 105, yPos, { align: "center" });
      yPos += 20;

      // Student Info Box
      doc.setDrawColor(200);
      doc.setFillColor(245, 245, 245);
      doc.rect(10, yPos, 190, 40, "FD");
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Student Name: ${studentName}`, 15, yPos + 10);
      doc.text(`Email: ${reportData.student?.email || "N/A"}`, 15, yPos + 20);
      doc.text(`Session ID: ${callId}`, 15, yPos + 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, yPos + 10);
      yPos += 50;

      // Summary Stats
      const stats = students[studentId] || { distractions: 0, warnings: 0 };
      doc.setFontSize(14);
      doc.text("Session Summary", 10, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.text(`• Total Distractions Detected: ${stats.distractions}`, 15, yPos);
      yPos += 8;
      doc.text(`• Warnings Issued: ${stats.warnings}`, 15, yPos);
      yPos += 8;
      doc.text(`• Teacher Notes Recorded: ${reportData.notes?.length || 0}`, 15, yPos);
      yPos += 20;

      // Timeline Events
      doc.setFontSize(14);
      doc.text("Detailed Event Timeline", 10, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(100);
      
      // Table Header
      doc.text("Time", 15, yPos);
      doc.text("Event Type", 50, yPos);
      doc.text("Details", 90, yPos);
      doc.line(10, yPos + 2, 200, yPos + 2);
      yPos += 8;

      doc.setTextColor(0);
      
      if (reportData.events && reportData.events.length > 0) {
        reportData.events.forEach((event) => {
          if (yPos > 270) { doc.addPage(); yPos = 20; } // Page break
          
          const time = new Date(event.timestamp).toLocaleTimeString();
          const type = event.eventType.toUpperCase();
          const details = event.details || "-";

          // Color coding for PDF text
          if (type === "DISTRACTION" || type === "TAB_SWITCH" || type === "WINDOW_BLUR") doc.setTextColor(220, 53, 69); // Red
          else if (type === "FOCUS" || type === "COMPLY") doc.setTextColor(40, 167, 69); // Green
          else doc.setTextColor(0);

          doc.text(time, 15, yPos);
          doc.text(type, 50, yPos);
          doc.text(details, 90, yPos);
          yPos += 7;
        });
      } else {
        doc.text("No events recorded.", 15, yPos);
        yPos += 10;
      }

      yPos += 15;

      // Teacher Notes Section
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text("Teacher Notes Log", 10, yPos);
      yPos += 10;

      if (reportData.notes && reportData.notes.length > 0) {
        reportData.notes.forEach((note) => {
           if (yPos > 270) { doc.addPage(); yPos = 20; }
           const time = new Date(note.createdAt).toLocaleTimeString();
           doc.setFontSize(10);
           doc.setFont("helvetica", "bold");
           doc.text(`[${time}]:`, 15, yPos);
           doc.setFont("helvetica", "normal");
           doc.text(note.note, 45, yPos);
           yPos += 8;
        });
      } else {
        doc.setFontSize(10);
        doc.text("No notes recorded.", 15, yPos);
      }

      doc.save(`${studentName}_Report.pdf`);
      toast.success("Report downloaded");
    } catch (error) {
      console.error("Report generation failed:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="absolute left-4 bottom-4 top-20 w-80 bg-base-100/95 backdrop-blur-xl border border-base-300 flex flex-col z-40 rounded-xl shadow-2xl overflow-hidden">
      {/* HEADER */}
      <div className="p-4 border-b border-base-200 bg-base-200/50">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <UserIcon className="size-5 text-primary" /> Class Monitor
        </h2>
      </div>

      {/* STUDENT LIST */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Object.values(students).length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                <p className="text-sm">Waiting for student activity...</p>
            </div>
        )}
        
        {Object.values(students).map((s) => (
          <div 
            key={s.id} 
            className={`card bg-base-100 shadow-sm border cursor-pointer transition-all hover:shadow-md ${
              s.status === "focused" ? "border-l-4 border-l-success" : "border-l-4 border-l-error"
            } ${selectedStudent === s.id ? "ring-2 ring-primary ring-offset-1" : ""}`}
            onClick={() => setSelectedStudent(s.id)}
          >
            <div className="card-body p-3 flex flex-row items-center gap-3">
              <div className="avatar">
                <div className="w-10 rounded-full ring-1 ring-base-300">
                  <img src={s.image || "https://avatar.iran.liara.run/public"} alt={s.name} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{s.name}</div>
                <div className={`text-xs font-medium flex items-center gap-1 ${s.status === "focused" ? "text-success" : "text-error"}`}>
                  {s.status === "focused" ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                  {s.lastActivity || s.status}
                </div>
              </div>
              {s.warnings > 0 && (
                <div className="badge badge-warning badge-sm gap-1 h-6">
                  <AlertTriangleIcon className="size-3" /> {s.warnings}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      {selectedStudent && (
        <div className="p-4 bg-base-200/50 border-t border-base-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase opacity-70">
              {students[selectedStudent]?.name}
            </span>
            <button 
              className="btn btn-ghost btn-xs text-primary" 
              onClick={() => generateReport(selectedStudent)} 
              disabled={isGenerating}
              title="Download Full Report"
            >
              {isGenerating ? <span className="loading loading-spinner loading-xs"></span> : <><DownloadIcon className="size-4" /> Report</>}
            </button>
          </div>
          <textarea
            className="textarea textarea-bordered w-full h-20 text-sm mb-2 focus:textarea-primary"
            placeholder="Log teacher notes..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          ></textarea>
          <button className="btn btn-primary btn-sm w-full" onClick={handleSaveNote}>
            Save Note
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherMonitoringDashboard;