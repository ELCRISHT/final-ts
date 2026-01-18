/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import { socket } from "../lib/socket";
import { saveMonitoringEvent } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import { Activity } from "lucide-react";

const WARNING_THRESHOLD = 10;
const IDLE_THRESHOLD = 15000; // 15 seconds for testing

const StudentMonitoringPanel = ({ callId }) => {
  const { authUser } = useAuthUser();
  const [isFocused, setIsFocused] = useState(true);
  const [warnings, setWarnings] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const [focusedTime, setFocusedTime] = useState(0);
  const [distractedTime, setDistractedTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Focused");
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized for cleaner interface
  
  const focusInterval = useRef(null);
  const idleTimer = useRef(null);

  const sendEvent = (eventType, details) => {
    if (!authUser) return;
    const payload = {
      callId,
      studentId: authUser._id,
      studentName: authUser.fullName,
      studentImage: authUser.profilePic,
      eventType,
      details,
      timestamp: new Date(),
    };
    socket.emit("monitoring:event", payload);
    saveMonitoringEvent(payload);
  };

  // --- FIX: Send initial signal so Teacher sees student immediately ---
  useEffect(() => {
    if (authUser) {
      sendEvent("focus", "Student Joined Session");
    }
  }, [authUser]); 
  // ------------------------------------------------------------------

  useEffect(() => {
    focusInterval.current = setInterval(() => {
      if (isFocused) setFocusedTime((prev) => prev + 1);
      else setDistractedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(focusInterval.current);
  }, [isFocused]);

  const handleDistraction = (type, details) => {
    if (!isFocused) return; // Already distracted
    setIsFocused(false);
    setStatusMessage(details);
    setDistractions((prev) => prev + 1);
    sendEvent(type, details);
  };

  const handleFocus = () => {
    if (isFocused) return;
    setIsFocused(true);
    setStatusMessage("Focused");
    sendEvent("focus", "Student regained focus");
  };

  const handleComply = () => {
    setIsFocused(true);
    setStatusMessage("Focused");
    // Reset specific counters if needed, or just acknowledge
    sendEvent("comply", "Student manually complied");
    toast.success("Thanks for focusing!");
  };

  useEffect(() => {
    const resetIdleTimer = () => {
      if (!isFocused && statusMessage === "Idle") handleFocus();
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        handleDistraction("distraction", "Idle (No Activity)");
      }, IDLE_THRESHOLD);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleDistraction("tab_switch", "Switched Tab");
    };

    const handleWindowBlur = () => handleDistraction("window_blur", "Left Window");
    
    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("click", resetIdleTimer);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer.current);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isFocused, callId, authUser]); 

  useEffect(() => {
    const newWarnings = Math.floor(distractions / 3);
    if (newWarnings > warnings) {
      sendEvent("warning", `Threshold reached: ${distractions} distractions`);
      setWarnings(newWarnings);
      if (newWarnings >= WARNING_THRESHOLD) toast.error("Critical Warning: Focus required!");
    }
  }, [distractions, warnings]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Minimized view
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={`fixed right-6 top-24 backdrop-blur-xl shadow-xl rounded-xl border p-3 z-[60] transition-all duration-300 hover:scale-105 ${
          isFocused 
            ? "bg-gradient-to-br from-base-100/95 to-success/5 border-success/30" 
            : "bg-gradient-to-br from-base-100/95 to-error/10 border-error/30 animate-pulse"
        }`}
      >
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <div className={`badge badge-sm gap-1 ${
            isFocused ? "badge-success" : "badge-error animate-pulse"
          }`}>
            <div className="size-1.5 rounded-full bg-white" />
            {isFocused ? "Focused" : "Distracted"}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed right-6 top-24 w-72 backdrop-blur-xl shadow-2xl rounded-2xl border p-5 z-[60] transition-all duration-300 animate-in slide-in-from-right ${
      isFocused 
        ? "bg-gradient-to-br from-base-100/95 to-success/5 border-success/30" 
        : "bg-gradient-to-br from-base-100/95 to-error/10 border-error/30 animate-pulse"
    }`}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 border-b border-base-content/10 pb-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          My Status
        </h3>
        <div className="flex items-center gap-2">
          <div className={`badge gap-2 p-3 shadow-md ${
            isFocused 
              ? "badge-success animate-none" 
              : "badge-error animate-pulse"
          }`}>
            <div className={`size-2 rounded-full bg-white ${
              isFocused ? "" : "animate-ping absolute"
            }`} />
            <div className="size-2 rounded-full bg-white relative" />
            {isFocused ? "Focused" : "Distracted"}
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="btn btn-ghost btn-xs btn-square"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="size-4 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* STATUS MESSAGE */}
      {!isFocused && (
        <div className="alert alert-error py-2 text-xs mb-4 shadow-sm">
          <span>⚠️ {statusMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* COMPLY BUTTON - SHOWS IMMEDIATELY WHEN DISTRACTED */}
        {!isFocused && (
          <button 
            className="btn btn-error w-full shadow-lg hover:shadow-xl bg-gradient-to-r from-error to-error/80 border-0 hover:scale-105 transition-all duration-300 animate-bounce"
            onClick={handleComply}
          >
            <span className="drop-shadow-md">🎯 I'm Back & Focused!</span>
          </button>
        )}

        {/* METRICS */}
        <div>
          <div className="flex justify-between text-xs mb-1 font-semibold opacity-70">
            <span>Warning Level</span>
            <span className={warnings >= WARNING_THRESHOLD ? "text-error" : ""}>{warnings}/{WARNING_THRESHOLD}</span>
          </div>
          <progress className={`progress w-full h-2 ${warnings >= WARNING_THRESHOLD ? "progress-error" : "progress-warning"}`} value={warnings} max={WARNING_THRESHOLD}></progress>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="flex flex-col bg-gradient-to-br from-success/20 to-success/5 rounded-xl p-3 text-center border border-success/20 hover:border-success/40 transition-all duration-300 hover:shadow-lg">
            <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Focus Time</span>
            <span className="text-xl font-bold text-success font-mono drop-shadow-sm">{formatTime(focusedTime)}</span>
          </div>
          <div className="flex flex-col bg-gradient-to-br from-error/20 to-error/5 rounded-xl p-3 text-center border border-error/20 hover:border-error/40 transition-all duration-300 hover:shadow-lg">
            <span className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Lost Time</span>
            <span className="text-xl font-bold text-error font-mono drop-shadow-sm">{formatTime(distractedTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMonitoringPanel;