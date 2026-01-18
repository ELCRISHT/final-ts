import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import { saveTeacherNote, getReportData } from "../lib/api";
import { DownloadIcon, UserIcon, AlertTriangleIcon, CheckCircle2, XCircle, ChevronDownIcon, ChevronUpIcon, UsersIcon } from "lucide-react";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

const TeacherMonitoringDashboard = ({ callId }) => {
  const [students, setStudents] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [expandedStudents, setExpandedStudents] = useState({});
  const [note, setNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true);

  useEffect(() => {
    socket.on("monitoring:update", (data) => {
      setStudents((prev) => {
        const student = prev[data.studentId] || { 
          id: data.studentId, 
          name: data.studentName || "Unknown", 
          image: data.studentImage, 
          status: "focused", 
          warnings: 0, 
          distractions: 0,
          focusTime: 0,
          distractedTime: 0,
          lastSeen: new Date(),
          events: []
        };

        let updates = {
          lastSeen: new Date()
        };
        
        if (data.studentName) updates.name = data.studentName;
        if (data.studentImage) updates.image = data.studentImage;

        // Track event history
        const newEvent = {
          type: data.eventType,
          details: data.details,
          timestamp: data.timestamp || new Date()
        };
        updates.events = [...(student.events || []).slice(-20), newEvent]; // Keep last 20 events

        if (data.eventType === "focus" || data.eventType === "comply") {
            updates.status = "focused";
            updates.lastActivity = data.eventType === "comply" ? "Complied" : "Regained Focus";
            if (data.eventType === "comply") {
              toast.success(`${student.name} is now focused!`);
            }
        }
        
        if (["distraction", "tab_switch", "window_blur"].includes(data.eventType)) {
          updates.status = "distracted";
          updates.distractions = (student.distractions || 0) + 1;
          updates.lastActivity = data.details || "Distracted";
          
          // Alert teacher if critical
          if (updates.distractions % 5 === 0) {
            toast.error(`${student.name} has ${updates.distractions} distractions!`);
          }
        }
        
        if (data.eventType === "warning") {
          updates.warnings = (student.warnings || 0) + 1;
          updates.lastActivity = "Warning Threshold";
          toast.warning(`⚠️ ${student.name} reached warning threshold`);
        }

        return {
          ...prev,
          [data.studentId]: { ...student, ...updates }
        };
      });
    });

    // Handle student disconnection
    socket.on("user:left", (data) => {
      setStudents((prev) => {
        const updated = { ...prev };
        if (updated[data.userId]) {
          updated[data.userId].status = "offline";
          updated[data.userId].lastActivity = "Left session";
        }
        return updated;
      });
    });

    return () => {
      socket.off("monitoring:update");
      socket.off("user:left");
    };
  }, []);

  const toggleStudentExpansion = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSaveNote = async () => {
    if(!selectedStudent || !note.trim()) return;
    try {
      await saveTeacherNote({ studentId: selectedStudent, callId, note });
      setNote("");
      setSelectedStudent(null);
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

  const activeStudents = Object.values(students).filter(s => s.status !== "offline");
  const totalDistractions = activeStudents.reduce((sum, s) => sum + (s.distractions || 0), 0);
  const totalWarnings = activeStudents.reduce((sum, s) => sum + (s.warnings || 0), 0);

  return (
    <div className={`fixed left-6 top-24 bottom-24 bg-base-100/95 backdrop-blur-xl border border-base-300 flex flex-col z-[45] rounded-xl shadow-2xl overflow-hidden transition-all ${
      isDashboardExpanded ? 'w-[380px]' : 'w-14'
    }`}>
      {/* HEADER */}
      <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-between">
        {isDashboardExpanded && (
          <>
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                <UsersIcon className="size-5 text-primary" /> Class Monitor
              </h2>
              <p className="text-xs opacity-60 mt-1">
                {activeStudents.length} student{activeStudents.length !== 1 ? 's' : ''} active
              </p>
            </div>
            <button 
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => setIsDashboardExpanded(false)}
            >
              <ChevronDownIcon className="size-4" />
            </button>
          </>
        )}
        {!isDashboardExpanded && (
          <button 
            className="btn btn-ghost btn-sm btn-square w-full"
            onClick={() => setIsDashboardExpanded(true)}
          >
            <UsersIcon className="size-5" />
          </button>
        )}
      </div>

      {isDashboardExpanded && (
        <>
          {/* SUMMARY STATS */}
          {activeStudents.length > 0 && (
            <div className="p-3 bg-gradient-to-b from-base-200/50 to-transparent grid grid-cols-3 gap-2 border-b border-primary/10">
              <div className="text-center p-2 rounded-xl bg-gradient-to-br from-success/20 to-success/10 border border-success/20 shadow-sm hover:shadow-md transition-all">
                <div className="text-2xl font-bold text-success drop-shadow">{activeStudents.length}</div>
                <div className="text-xs opacity-60 font-medium">Active</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-gradient-to-br from-error/20 to-error/10 border border-error/20 shadow-sm hover:shadow-md transition-all">
                <div className="text-2xl font-bold text-error drop-shadow">{totalDistractions}</div>
                <div className="text-xs opacity-60 font-medium">Distractions</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 border border-warning/20 shadow-sm hover:shadow-md transition-all">
                <div className="text-2xl font-bold text-warning drop-shadow">{totalWarnings}</div>
                <div className="text-xs opacity-60 font-medium">Warnings</div>
              </div>
            </div>
          )}

          {/* STUDENT LIST */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {Object.values(students).length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                    <UsersIcon className="size-12 mb-3" />
                    <p className="text-sm">Waiting for students to join...</p>
                </div>
            )}
            
            {Object.values(students).map((s) => (
              <div 
                key={s.id} 
                className={`card bg-base-100 shadow-sm border transition-all ${
                  s.status === "focused" ? "border-l-4 border-l-success" : 
                  s.status === "offline" ? "border-l-4 border-l-base-300 opacity-60" :
                  "border-l-4 border-l-error animate-pulse"
                }`}
              >
                {/* STUDENT HEADER */}
                <div 
                  className="card-body p-3 flex flex-row items-center gap-3 cursor-pointer hover:bg-base-200/50"
                  onClick={() => toggleStudentExpansion(s.id)}
                >
                  <div className="avatar">
                    <div className="w-10 rounded-full ring-1 ring-base-300">
                      <img src={s.image || "https://avatar.iran.liara.run/public"} alt={s.name} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{s.name}</div>
                    <div className={`text-xs font-medium flex items-center gap-1 ${
                      s.status === "focused" ? "text-success" : 
                      s.status === "offline" ? "text-base-content/50" :
                      "text-error"
                    }`}>
                      {s.status === "focused" && <CheckCircle2 className="size-3" />}
                      {s.status === "distracted" && <XCircle className="size-3" />}
                      {s.lastActivity || s.status}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {s.distractions > 0 && (
                      <div className="badge badge-error badge-sm">{s.distractions}</div>
                    )}
                    {s.warnings > 0 && (
                      <div className="badge badge-warning badge-sm gap-1">
                        <AlertTriangleIcon className="size-3" /> {s.warnings}
                      </div>
                    )}
                    {expandedStudents[s.id] ? 
                      <ChevronUpIcon className="size-4 opacity-60" /> : 
                      <ChevronDownIcon className="size-4 opacity-60" />
                    }
                  </div>
                </div>

                {/* EXPANDED DETAILS */}
                {expandedStudents[s.id] && (
                  <div className="px-3 pb-3 space-y-2 border-t border-base-200 pt-2 mt-2">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-base-200/50 p-2 rounded">
                        <div className="opacity-60">Distractions</div>
                        <div className="font-bold text-error">{s.distractions || 0}</div>
                      </div>
                      <div className="bg-base-200/50 p-2 rounded">
                        <div className="opacity-60">Warnings</div>
                        <div className="font-bold text-warning">{s.warnings || 0}</div>
                      </div>
                    </div>

                    {/* Recent Events */}
                    {s.events && s.events.length > 0 && (
                      <div className="text-xs space-y-1">
                        <div className="font-bold opacity-60">Recent Activity:</div>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {s.events.slice(-5).reverse().map((event, idx) => (
                            <div key={idx} className={`p-1.5 rounded text-xs ${
                              event.type === "focus" || event.type === "comply" ? "bg-success/10 text-success" :
                              event.type === "warning" ? "bg-warning/10 text-warning" :
                              "bg-error/10 text-error"
                            }`}>
                              <div className="font-semibold">{event.type.toUpperCase()}</div>
                              <div className="opacity-80">{event.details}</div>
                              <div className="opacity-60 text-[10px]">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button 
                        className="btn btn-sm btn-primary flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(s.id);
                        }}
                      >
                        <UserIcon className="size-3" /> Add Note
                      </button>
                      <button 
                        className="btn btn-sm btn-secondary flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateReport(s.id);
                        }}
                        disabled={isGenerating}
                      >
                        <DownloadIcon className="size-3" /> Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* NOTE TAKING MODAL */}
          {selectedStudent && (
            <div className="p-4 bg-base-200/50 border-t border-base-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase opacity-70">
                  Add Note for {students[selectedStudent]?.name}
                </span>
                <button 
                  className="btn btn-ghost btn-xs"
                  onClick={() => setSelectedStudent(null)}
                >
                  ✕
                </button>
              </div>
              <textarea 
                className="textarea textarea-bordered w-full text-sm h-20 mb-2" 
                placeholder="Enter observation or feedback..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button 
                className="btn btn-primary btn-sm w-full"
                onClick={handleSaveNote}
                disabled={!note.trim()}
              >
                Save Note
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherMonitoringDashboard;