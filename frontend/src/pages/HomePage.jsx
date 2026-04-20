import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  VideoIcon,
  UsersIcon,
  PlusIcon,
  ArrowRightIcon,
  ActivityIcon,
  ClockIcon,
  TrendingUpIcon,
  ShieldAlertIcon,
  MonitorIcon,
  KeyRoundIcon,
  BookOpenIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

// ─────────────────────────────────────────────────────────────────────────────
// Shared stat card
const StatCard = ({ icon: Icon, value, label, color, animate }) => (
  <div className={`ts-stat-card p-4 flex items-start gap-3 ${animate ? "animate-fade-in-up" : ""}`}>
    <div className={`p-2 rounded-xl ${color.bg} border ${color.border}`}>
      <Icon className={`size-4 ${color.text}`} />
    </div>
    <div>
      <p className={`text-xl font-bold ${color.text}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Dashboard
const TeacherHome = ({ authUser, rooms, isLoading, onCreateRoom, isCreating, newRoomName, setNewRoomName, navigate }) => {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-5xl mx-auto space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl font-bold text-slate-100">
            {greeting}, <span className="gradient-text-teacher">{authUser?.fullName?.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Here's an overview of your classrooms.</p>
        </div>
        <button
          onClick={() => navigate("/rooms")}
          className="ts-btn-primary btn btn-sm px-5 gap-2 self-start sm:self-center"
        >
          <PlusIcon className="size-4" />
          New Classroom
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={VideoIcon} value={rooms.length} label="Classrooms" color={{ bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" }} animate />
        <StatCard icon={MonitorIcon} value={0} label="Live Sessions" color={{ bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" }} animate />
        <StatCard icon={UsersIcon} value="—" label="Total Students" color={{ bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" }} animate />
        <StatCard icon={TrendingUpIcon} value="—" label="Avg Attention" color={{ bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" }} animate />
      </div>

      {/* Quick Create */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/8 to-purple-500/5 border border-blue-500/15">
        <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <PlusIcon className="size-4 text-blue-400" />
          Create a New Classroom
        </h2>
        <form onSubmit={onCreateRoom} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., CS101 — Object-Oriented Programming"
            className="ts-input input flex-1 h-10 px-3 text-sm"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            maxLength={50}
          />
          <button
            type="submit"
            className="ts-btn-primary btn btn-sm px-5 gap-2 h-10"
            disabled={isCreating || !newRoomName.trim()}
          >
            {isCreating ? <span className="loading loading-spinner loading-xs" /> : <PlusIcon className="size-4" />}
            Create
          </button>
        </form>
      </div>

      {/* Recent Classrooms */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <BookOpenIcon className="size-4 text-slate-400" />
            Your Classrooms
            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold">{rooms.length}</span>
          </h2>
          <button onClick={() => navigate("/rooms")} className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors">
            View all <ArrowRightIcon className="size-3" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-md text-blue-400" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/2 border border-white/6 text-center">
            <VideoIcon className="size-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No classrooms yet</p>
            <p className="text-xs text-slate-500 mt-1">Create your first classroom above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.slice(0, 6).map((room) => (
              <div
                key={room._id}
                className="ts-room-card p-4 cursor-pointer group"
                onClick={() => navigate(`/call/${room._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                    <VideoIcon className="size-4 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 bg-white/3 px-2 py-0.5 rounded">
                    {room._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-200 truncate mb-1">{room.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {new Date(room.createdAt).toLocaleDateString()}
                </p>
                <button className="mt-3 w-full ts-btn-primary btn btn-xs py-1.5 gap-1.5 text-xs">
                  <VideoIcon className="size-3" /> Start Session
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Student Dashboard
const StudentHome = ({ authUser, navigate }) => {
  const [roomCode, setRoomCode] = useState("");
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleJoin = (e) => {
    e.preventDefault();
    const code = roomCode.trim();
    if (!code) return;
    navigate(`/call/${code}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold text-slate-100">
          {greeting}, <span className="gradient-text">{authUser?.fullName?.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Ready for today's session?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUpIcon} value="—" label="Avg Attention" color={{ bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" }} animate />
        <StatCard icon={ShieldAlertIcon} value="0" label="Warnings" color={{ bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" }} animate />
        <StatCard icon={ActivityIcon} value="—" label="Sessions Joined" color={{ bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" }} animate />
        <StatCard icon={TrendingUpIcon} value="—" label="Best Score" color={{ bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" }} animate />
      </div>

      {/* Join a Classroom — primary CTA */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/8 to-cyan-500/5 border border-blue-500/15">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/25">
            <KeyRoundIcon className="size-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-200">Join a Classroom</h2>
            <p className="text-xs text-slate-500">Enter the room code or link your teacher shared</p>
          </div>
        </div>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            placeholder="Paste room code or ID..."
            className="ts-input input flex-1 h-11 px-4 text-sm font-mono"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button
            type="submit"
            className="ts-btn-primary btn px-6 h-11 gap-2 text-sm"
            disabled={!roomCode.trim()}
          >
            Join
            <ArrowRightIcon className="size-4" />
          </button>
        </form>
        <p className="text-xs text-slate-600 mt-2">
          Or{" "}
          <button
            onClick={() => navigate("/rooms")}
            className="text-blue-400 hover:underline font-medium"
          >
            browse available classrooms →
          </button>
        </p>
      </div>

      {/* Tips */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: MonitorIcon, title: "Stay Focused", desc: "Keep your eyes on the screen — attention is tracked in real time.", color: "text-blue-400", bg: "bg-blue-500/8 border-blue-500/15" },
          { icon: ShieldAlertIcon, title: "Avoid Distractions", desc: "Phone usage and tab switching are detected automatically.", color: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/15" },
          { icon: ActivityIcon, title: "Earn High Scores", desc: "Maintain a high attention score throughout the session.", color: "text-green-400", bg: "bg-green-500/8 border-green-500/15" },
        ].map(({ icon: Icon, title, desc, color, bg }, i) => (
          <div
            key={title}
            className={`p-4 rounded-2xl border ${bg} animate-fade-in-up`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <Icon className={`size-5 ${color} mb-2`} />
            <p className="text-sm font-semibold text-slate-300 mb-1">{title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Root
const HomePage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const isTeacher = authUser?.role === "teacher";

  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/rooms")
      .then((r) => setRooms(r.data))
      .catch(() => toast.error("Could not load classrooms"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setIsCreating(true);
    try {
      const r = await axiosInstance.post("/rooms/create", { name: newRoomName.trim() });
      setRooms([r.data, ...rooms]);
      setNewRoomName("");
      toast.success("Classroom created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create classroom");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-5 sm:p-7 overflow-y-auto h-full">
      {isTeacher ? (
        <TeacherHome
          authUser={authUser}
          rooms={rooms}
          isLoading={isLoading}
          onCreateRoom={handleCreateRoom}
          isCreating={isCreating}
          newRoomName={newRoomName}
          setNewRoomName={setNewRoomName}
          navigate={navigate}
        />
      ) : (
        <StudentHome authUser={authUser} navigate={navigate} />
      )}
    </div>
  );
};

export default HomePage;
