import { Users as UsersIcon, Activity, MonitorIcon, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";

// ── Session Duration Timer ────────────────────────────────────────────────────
const useSessionTimer = () => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
};
// ─────────────────────────────────────────────────────────────────────────────

// ── Full-width Zoom-style top bar combining session stats + participants ──
const CallStats = ({ participants, authUser, callId }) => {
  const [showParticipants, setShowParticipants] = useState(false);
  const sessionTime = useSessionTimer();
  const isTeacher = authUser?.role === "teacher";
  const studentCount = participants.filter(
    (p) => !p.isLocalParticipant || authUser?.role === "student"
  ).length;

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-11 z-[60] flex items-center justify-between px-4 bg-base-200/90 backdrop-blur-md border-b border-base-300/40">
        {/* Left: Brand + Session */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <MonitorIcon className="size-3.5 text-blue-400" />
          </div>
          <span className="text-sm font-bold text-base-content/80 hidden sm:block">TrackSmart</span>
          <span className="text-base-content/30 hidden sm:block">|</span>
          <span className="text-xs text-base-content/50 font-mono hidden sm:block truncate max-w-[160px]">
            {callId ? callId.slice(-8).toUpperCase() : "SESSION"}
          </span>
        </div>

        {/* Center: LIVE badge + timer */}
        <div className="flex items-center gap-2">
          {/* Session Timer */}
          <div className="flex items-center gap-1.5 bg-base-300/60 border border-base-content/10 text-base-content/70 text-xs font-mono font-semibold px-3 py-1 rounded-full">
            <Clock className="size-3 text-primary" />
            {sessionTime}
          </div>

          {isTeacher && studentCount > 0 && (
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full">
              <Activity className="size-3" />
              {studentCount} student{studentCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Right: Participants toggle */}
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-300/50 hover:bg-base-300 border border-base-content/10 transition-all text-xs font-semibold"
        >
          <UsersIcon className="size-3.5 text-primary" />
          <span className="font-bold">{participants.length}</span>
          <span className="text-base-content/60 hidden sm:inline">
            Participant{participants.length !== 1 ? "s" : ""}
          </span>
        </button>
      </div>

      {/* Participants Dropdown Panel */}
      {showParticipants && (
        <div className="fixed top-11 right-0 z-[59] w-72 bg-base-100/95 backdrop-blur-xl shadow-2xl border-l border-base-300/40 border-b border-b-base-300/40 rounded-bl-2xl overflow-hidden animate-fade-in">
          <div className="p-3 border-b border-base-200 bg-base-200/50">
            <p className="text-xs font-bold text-base-content/70 uppercase tracking-wider">In This Call</p>
          </div>
          <div className="overflow-y-auto max-h-72">
            {participants.map((participant) => {
              const hasVideo = participant.publishedTracks?.includes("video");
              const hasAudio = participant.publishedTracks?.includes("audio");
              return (
                <div
                  key={participant.sessionId}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-base-200/50 border-b border-base-200/40 last:border-b-0 transition-colors"
                >
                  <div className="avatar">
                    <div className={`w-8 rounded-full ring-2 ${participant.isLocalParticipant ? "ring-primary" : "ring-base-300"}`}>
                      <img
                        src={participant.image || `https://avatar.iran.liara.run/public/${participant.userId?.charCodeAt(0) % 100}`}
                        alt={participant.name || participant.userId}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                      {participant.name || participant.userId}
                      {participant.isLocalParticipant && (
                        <span className="badge badge-primary badge-xs">You</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {hasVideo ? (
                      <div className="p-1 bg-success/20 rounded-full border border-success/30">
                        <Video className="size-3 text-success" />
                      </div>
                    ) : (
                      <div className="p-1 bg-base-300/50 rounded-full">
                        <VideoOff className="size-3 opacity-40" />
                      </div>
                    )}
                    {hasAudio ? (
                      <div className="p-1 bg-success/20 rounded-full border border-success/30">
                        <Mic className="size-3 text-success" />
                      </div>
                    ) : (
                      <div className="p-1 bg-error/20 rounded-full border border-error/30">
                        <MicOff className="size-3 text-error" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default CallStats;
