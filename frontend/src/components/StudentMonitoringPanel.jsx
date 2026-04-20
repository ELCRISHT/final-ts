/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef, useCallback } from "react";
import { socket } from "../lib/socket";
import { saveMonitoringEvent } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import usePhoneDetection from "../hooks/usePhoneDetection";
import toast from "react-hot-toast";
import { Activity, Smartphone } from "lucide-react";

// ── Double-beep using Web Audio API (no external deps) ──────────────────────
const playDoubleBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (startTime) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, startTime);        // A5 – sharp alert tone
      gain.gain.setValueAtTime(0.6, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
      osc.start(startTime);
      osc.stop(startTime + 0.18);
    };
    const now = ctx.currentTime;
    beep(now);           // first beep
    beep(now + 0.25);    // second beep, 250 ms later
    // Close context after both beeps finish
    setTimeout(() => ctx.close(), 700);
  } catch (e) {
    // silently ignore if AudioContext is unavailable
  }
};
// ─────────────────────────────────────────────────────────────────────────────

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
  const [phoneDetected, setPhoneDetected] = useState(false);

  const focusInterval = useRef(null);
  const idleTimer = useRef(null);
  const phoneCooldown = useRef(false); // prevents rapid-fire phone alerts

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
        playDoubleBeep();
        handleDistraction("distraction", "Idle (No Activity)");
      }, IDLE_THRESHOLD);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        playDoubleBeep();
        handleDistraction("tab_switch", "Switched Tab");
      }
    };

    const handleWindowBlur = () => {
      playDoubleBeep();
      handleDistraction("window_blur", "Left Window");
    };

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
      playDoubleBeep();
      sendEvent("warning", `Threshold reached: ${distractions} distractions`);
      setWarnings(newWarnings);
      if (newWarnings >= WARNING_THRESHOLD) toast.error("Critical Warning: Focus required!");
    }
  }, [distractions, warnings]);

  // ── Phone Detection ────────────────────────────────────────────────────────
  const handlePhoneDetected = useCallback((score) => {
    if (phoneCooldown.current) return; // already alerted recently
    phoneCooldown.current = true;
    setPhoneDetected(true);
    playDoubleBeep();
    handleDistraction("phone_usage", `Phone detected (confidence: ${Math.round(score * 100)}%)`);
    toast.error("📵 Phone detected! Please put it away.", { duration: 4000 });
    // Reset visual indicator after 6 s, cooldown after 15 s
    setTimeout(() => setPhoneDetected(false), 6000);
    setTimeout(() => { phoneCooldown.current = false; }, 15000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePhoneDetection(true, handlePhoneDetected, 2500);
  // ──────────────────────────────────────────────────────────────────────────

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Minimized view — inline pill in the top bar, to the left of the Participants button
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        title="Click to expand your monitoring status"
        className={`fixed top-0 right-[172px] h-11 z-[61] flex items-center gap-2 px-3 border-l border-r border-base-300/30 bg-base-200/50 hover:bg-base-300/50 transition-all duration-300 ${!isFocused ? "animate-pulse" : ""
          }`}
      >
        <Activity className="size-3.5 text-primary shrink-0" />
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${isFocused ? "text-success" : "text-error"
          }`}>
          <span className={`size-1.5 rounded-full ${isFocused ? "bg-success" : "bg-error animate-ping"}`} />
          {isFocused ? "Focused" : "Distracted"}
        </span>
        {phoneDetected && (
          <span className="flex items-center gap-1 text-xs font-bold text-orange-400 animate-pulse">
            <Smartphone className="size-3" />
            Phone!
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed right-[172px] top-11 w-72 backdrop-blur-xl shadow-2xl rounded-b-2xl border-x border-b p-5 z-[60] transition-all duration-300 animate-in slide-in-from-top ${isFocused
        ? "bg-gradient-to-br from-base-100/95 to-success/5 border-success/30"
        : "bg-gradient-to-br from-base-100/95 to-error/10 border-error/30"
      }`}>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 border-b border-base-content/10 pb-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          My Status
        </h3>
        <div className="flex items-center gap-2">
          <div className={`badge gap-2 p-3 shadow-md ${isFocused
              ? "badge-success animate-none"
              : "badge-error animate-pulse"
            }`}>
            <div className={`size-2 rounded-full bg-white ${isFocused ? "" : "animate-ping absolute"
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
          <span> {statusMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* COMPLY BUTTON - SHOWS IMMEDIATELY WHEN DISTRACTED */}
        {!isFocused && (
          <button
            className="btn btn-error w-full shadow-lg hover:shadow-xl bg-gradient-to-r from-error to-error/80 border-0 hover:scale-105 transition-all duration-300 animate-bounce"
            onClick={handleComply}
          >
            <span className="drop-shadow-md">Comply</span>
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