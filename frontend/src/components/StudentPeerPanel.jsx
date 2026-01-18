import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import { 
  Users, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity
} from "lucide-react";

const StudentPeerPanel = ({ callId, currentUserId }) => {
  const [peers, setPeers] = useState({});
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed for cleaner interface
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Listen for peer status updates
    socket.on("peer:status_update", (data) => {
      if (data.studentId !== currentUserId) {
        setPeers((prev) => ({
          ...prev,
          [data.studentId]: {
            id: data.studentId,
            name: data.studentName,
            image: data.studentImage,
            status: data.status,
            lastActivity: data.lastActivity,
            lastSeen: new Date(),
          },
        }));
      }
    });

    // Listen for peers leaving
    socket.on("peer:left", (data) => {
      setPeers((prev) => {
        const updated = { ...prev };
        if (updated[data.userId]) {
          updated[data.userId].status = "offline";
          updated[data.userId].lastActivity = "Left the session";
        }
        return updated;
      });
    });

    // Request current peers when joining
    socket.emit("peer:request_status", { callId, userId: currentUserId });

    return () => {
      socket.off("peer:status_update");
      socket.off("peer:left");
    };
  }, [callId, currentUserId]);

  const activePeers = Object.values(peers).filter((p) => p.status !== "offline");
  const focusedCount = activePeers.filter((p) => p.status === "focused").length;
  const distractedCount = activePeers.filter((p) => p.status === "distracted").length;

  if (Object.keys(peers).length === 0) {
    return null; // Don't show if no other students
  }

  return (
    <div className="fixed left-6 top-24 z-[45]">
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gradient-to-br from-base-100/95 to-primary/10 backdrop-blur-xl rounded-xl border border-primary/30 px-3 py-2 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
        >
          <Users className="size-4 text-primary" />
          <span className="font-bold">{activePeers.length}</span>
          <span className="text-xs opacity-70">Peers</span>
          {distractedCount > 0 && (
            <span className="badge badge-warning badge-xs animate-pulse shadow-md">{distractedCount}</span>
          )}
        </button>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="bg-base-100/95 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-2xl w-64 overflow-hidden animate-in slide-in-from-left duration-300">
          {/* Header */}
          <div className="p-3 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span className="font-bold text-sm">Classmates</span>
              <span className="badge badge-ghost badge-sm">{activePeers.length}</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="btn btn-ghost btn-xs btn-square"
            >
              <ChevronUp className="size-4" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-gradient-to-b from-base-200/50 to-transparent border-b border-primary/10">
            <div className="flex items-center gap-2 bg-gradient-to-br from-success/20 to-success/10 p-2 rounded-xl border border-success/20 shadow-sm hover:shadow-md transition-shadow">
              <CheckCircle2 className="size-4 text-success drop-shadow" />
              <div>
                <div className="text-lg font-bold text-success drop-shadow">{focusedCount}</div>
                <div className="text-[10px] opacity-60 font-medium">Focused</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-br from-warning/20 to-warning/10 p-2 rounded-xl border border-warning/20 shadow-sm hover:shadow-md transition-shadow">
              <AlertTriangle className="size-4 text-warning drop-shadow" />
              <div>
                <div className="text-lg font-bold text-warning drop-shadow">{distractedCount}</div>
                <div className="text-[10px] opacity-60 font-medium">Distracted</div>
              </div>
            </div>
          </div>

          {/* Toggle Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-base-200/50 border-b border-base-200"
          >
            <span className="flex items-center gap-1 opacity-70">
              {showDetails ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              {showDetails ? "Hide Details" : "Show Details"}
            </span>
            <ChevronDown className={`size-3 transition-transform ${showDetails ? "rotate-180" : ""}`} />
          </button>

          {/* Peer List */}
          {showDetails && (
            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
              {Object.values(peers).map((peer) => (
                <div
                  key={peer.id}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                    peer.status === "focused"
                      ? "bg-success/5 border-l-2 border-l-success"
                      : peer.status === "offline"
                      ? "opacity-50 bg-base-200/30"
                      : "bg-warning/5 border-l-2 border-l-warning animate-pulse"
                  }`}
                >
                  {/* Avatar */}
                  <div className="avatar">
                    <div className="w-8 rounded-full ring-1 ring-base-300">
                      <img
                        src={peer.image || "https://avatar.iran.liara.run/public"}
                        alt={peer.name}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs truncate">{peer.name}</div>
                    <div className="flex items-center gap-1">
                      {peer.status === "focused" && (
                        <>
                          <CheckCircle2 className="size-3 text-success" />
                          <span className="text-[10px] text-success">Focused</span>
                        </>
                      )}
                      {peer.status === "distracted" && (
                        <>
                          <XCircle className="size-3 text-warning" />
                          <span className="text-[10px] text-warning truncate">
                            {peer.lastActivity || "Distracted"}
                          </span>
                        </>
                      )}
                      {peer.status === "offline" && (
                        <span className="text-[10px] opacity-50">Offline</span>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div
                    className={`size-2 rounded-full ${
                      peer.status === "focused"
                        ? "bg-success"
                        : peer.status === "offline"
                        ? "bg-base-300"
                        : "bg-warning animate-pulse"
                    }`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Motivation Message */}
          <div className="p-2 bg-primary/5 border-t border-base-200">
            <div className="flex items-center gap-2 text-xs">
              <Activity className="size-4 text-primary" />
              <span className="opacity-70">
                {focusedCount === activePeers.length
                  ? "Great! Everyone is focused! 🎉"
                  : distractedCount > focusedCount
                  ? "Let's refocus together! 💪"
                  : "Keep up the good work! 📚"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPeerPanel;
