import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  VideoIcon,
  CopyIcon,
  PlusIcon,
  UsersIcon,
  ClockIcon,
  Trash2Icon,
  ArrowRightIcon,
  SearchIcon,
  MonitorIcon,
  AlertTriangleIcon,
  XIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

// ── Skeleton room card ────────────────────────────────────────────────────────
const RoomSkeleton = () => (
  <div className="ts-room-card p-5 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5" />
        <div>
          <div className="h-4 bg-white/5 rounded w-32 mb-1.5" />
          <div className="h-3 bg-white/5 rounded w-20" />
        </div>
      </div>
    </div>
    <div className="h-3 bg-white/5 rounded w-28 mb-4" />
    <div className="flex gap-2">
      <div className="h-8 bg-white/5 rounded-lg flex-1" />
      <div className="h-8 bg-white/5 rounded-lg flex-1" />
    </div>
  </div>
);

// ── Delete confirmation modal ─────────────────────────────────────────────────
const DeleteModal = ({ room, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    />
    {/* Dialog */}
    <div className="relative w-full max-w-sm ts-auth-card p-6 shadow-2xl animate-fade-in-up">
      <div className="flex items-start gap-4 mb-5">
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/25 shrink-0">
          <AlertTriangleIcon className="size-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">Delete Classroom</h3>
          <p className="text-sm text-slate-400 mt-1">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-200">"{room?.name}"</span>?
            This action cannot be undone.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all shrink-0"
        >
          <XIcon className="size-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="btn btn-ghost flex-1 text-slate-400 border border-white/8"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(room._id)}
          className="btn flex-1 bg-red-500 hover:bg-red-600 text-white border-none gap-2"
        >
          <Trash2Icon className="size-3.5" />
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const RoomsPage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null); // modal state

  const isTeacher = authUser?.role === "teacher";

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axiosInstance.get("/rooms");
      setRooms(response.data);
    } catch {
      toast.error("Failed to load classrooms");
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setIsCreating(true);
    try {
      const response = await axiosInstance.post("/rooms/create", { name: newRoomName.trim() });
      toast.success("Classroom created!");
      setRooms([response.data, ...rooms]);
      setNewRoomName("");
      setShowCreateForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create classroom");
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDeleteRoom = async (roomId) => {
    try {
      await axiosInstance.delete(`/rooms/${roomId}`);
      setRooms(rooms.filter((r) => r._id !== roomId));
      toast.success("Classroom deleted");
    } catch {
      toast.error("Failed to delete classroom");
    } finally {
      setRoomToDelete(null);
    }
  };

  const copyRoomLink = (roomId) => {
    navigator.clipboard.writeText(`${window.location.origin}/call/${roomId}`);
    toast.success("Link copied!");
  };

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-5 sm:p-7 space-y-6">
          <div className="h-9 bg-white/5 rounded-xl w-48 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <RoomSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Delete confirmation modal */}
      {roomToDelete && (
        <DeleteModal
          room={roomToDelete}
          onConfirm={confirmDeleteRoom}
          onCancel={() => setRoomToDelete(null)}
        />
      )}

      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-5 sm:p-7 space-y-6">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/25">
                  <VideoIcon className="size-5 text-blue-400" />
                </div>
                Classrooms
              </h1>
              <p className="text-sm text-slate-400 mt-1 ml-0.5">
                {isTeacher
                  ? "Manage your classroom sessions and share links with students"
                  : "Join an available classroom session below"}
              </p>
            </div>

            {isTeacher && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="ts-btn-primary btn btn-sm px-5 gap-2 self-start sm:self-auto"
              >
                <PlusIcon className="size-4" />
                New Classroom
              </button>
            )}
          </div>

          {/* ── Create Form (Teachers) ── */}
          {isTeacher && showCreateForm && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/8 to-purple-500/5 border border-blue-500/15 animate-fade-in-up">
              <h2 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <PlusIcon className="size-4 text-blue-400" />
                Create New Classroom
              </h2>
              <form onSubmit={createRoom} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., CS101 — Data Structures"
                  className="ts-input input flex-1 h-10 px-3 text-sm"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-sm btn-ghost text-slate-500 h-10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ts-btn-primary btn btn-sm px-5 gap-2 h-10"
                  disabled={isCreating || !newRoomName.trim()}
                >
                  {isCreating ? <span className="loading loading-spinner loading-xs" /> : <PlusIcon className="size-3.5" />}
                  Create
                </button>
              </form>
            </div>
          )}

          {/* ── Search ── */}
          {rooms.length > 0 && (
            <div className="relative animate-fade-in">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search classrooms..."
                className="ts-input input w-full h-10 pl-9 pr-4 text-sm max-w-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* ── Room Count ── */}
          <div className="flex items-center gap-2">
            <UsersIcon className="size-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-400">
              {isTeacher ? "Your Classrooms" : "Available Classrooms"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold">
              {filtered.length}
            </span>
          </div>

          {/* ── Room Grid ── */}
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="p-5 rounded-2xl bg-white/3 border border-white/6 mb-4">
                <VideoIcon className="size-12 text-slate-600" />
              </div>
              <p className="text-base font-semibold text-slate-400">
                {search ? "No classrooms match your search" : isTeacher ? "No classrooms yet" : "No classrooms available"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {!search && isTeacher && "Click \"New Classroom\" to create your first session."}
                {!search && !isTeacher && "Your teacher hasn't created a session yet. Check back soon."}
              </p>
              {!search && isTeacher && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="ts-btn-primary btn btn-sm px-5 gap-2 mt-5 animate-pulse-glow"
                >
                  <PlusIcon className="size-4" /> Create First Classroom
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {filtered.map((room, i) => (
                <div
                  key={room._id}
                  className="ts-room-card p-5 flex flex-col justify-between"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Room Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0 mt-0.5">
                        <MonitorIcon className="size-4 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-200 leading-snug">{room.name}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          by {room.createdByName || "Unknown"}
                        </p>
                      </div>
                    </div>
                    {isTeacher && room.createdBy === authUser._id && (
                      <button
                        onClick={() => setRoomToDelete(room)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                        title="Delete classroom"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Room Meta */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ClockIcon className="size-3.5 shrink-0" />
                      <span>
                        Created {new Date(room.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-white/3 border border-white/6 text-slate-500">
                        ID: {room._id.slice(-8).toUpperCase()}
                      </span>
                      {room.participants > 0 && (
                        <span className="flex items-center gap-1 text-green-400 font-sans font-medium">
                          <span className="ts-dot-live" />
                          {room.participants} active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyRoomLink(room._id)}
                      className="btn btn-xs btn-ghost flex-1 gap-1.5 text-slate-400 hover:text-slate-200 border border-white/8 h-8"
                    >
                      <CopyIcon className="size-3.5" />
                      Copy Link
                    </button>
                    <button
                      onClick={() => navigate(`/call/${room._id}`)}
                      className="ts-btn-primary btn btn-xs flex-1 gap-1.5 h-8 text-xs"
                    >
                      {isTeacher ? <VideoIcon className="size-3.5" /> : <ArrowRightIcon className="size-3.5" />}
                      {isTeacher ? "Start" : "Join"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RoomsPage;
