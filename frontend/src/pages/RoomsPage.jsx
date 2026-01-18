import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { Video, Copy, ExternalLink, Plus, Users, Clock, Trash2, Link as LinkIcon } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const RoomsPage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isTeacher = authUser?.role === "teacher";

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axiosInstance.get("/rooms");
      setRooms(response.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    setIsCreating(true);
    try {
      const response = await axiosInstance.post("/rooms/create", {
        name: newRoomName.trim(),
      });
      
      toast.success("Room created successfully!");
      setRooms([response.data, ...rooms]);
      setNewRoomName("");
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error(error.response?.data?.message || "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      await axiosInstance.delete(`/rooms/${roomId}`);
      setRooms(rooms.filter(room => room._id !== roomId));
      toast.success("Room deleted");
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    }
  };

  const copyRoomLink = (roomId) => {
    const link = `${window.location.origin}/call/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success("Room link copied to clipboard!");
  };

  const joinRoom = (roomId) => {
    navigate(`/call/${roomId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Video className="size-8 text-primary" />
              Video Rooms
            </h1>
            <p className="text-base-content/60 mt-1">
              {isTeacher
                ? "Create and manage video call rooms for your students"
                : "Join available video call rooms"}
            </p>
          </div>
        </div>

        {/* Create Room Form (Teachers Only) */}
        {isTeacher && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl flex items-center gap-2">
                <Plus className="size-5" />
                Create New Room
              </h2>
              <form onSubmit={createRoom} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter room name (e.g., Math Class, Study Session)"
                  className="input input-bordered flex-1"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  maxLength={50}
                />
                <button
                  type="submit"
                  className="btn btn-primary gap-2"
                  disabled={isCreating || !newRoomName.trim()}
                >
                  {isCreating ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Create Room
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Rooms List */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="size-5 text-primary" />
            {isTeacher ? "Your Rooms" : "Available Rooms"}
            <span className="badge badge-primary">{rooms.length}</span>
          </h2>

          {rooms.length === 0 ? (
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body items-center text-center py-12">
                <Video className="size-16 text-base-content/30 mb-4" />
                <h3 className="text-xl font-bold mb-2">No rooms available</h3>
                <p className="text-base-content/60">
                  {isTeacher
                    ? "Create your first room to get started"
                    : "No rooms are currently available. Check back later!"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="card bg-base-200 shadow-xl hover:shadow-2xl transition-all duration-200 border border-base-300"
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <h3 className="card-title text-lg flex-1">{room.name}</h3>
                      {isTeacher && room.createdBy === authUser._id && (
                        <button
                          onClick={() => deleteRoom(room._id)}
                          className="btn btn-ghost btn-sm btn-square text-error"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-sm opacity-70">
                      <div className="flex items-center gap-2">
                        <Users className="size-4" />
                        <span>
                          Created by {room.createdByName || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="size-4" />
                        <span>
                          {new Date(room.createdAt).toLocaleDateString()} at{" "}
                          {new Date(room.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {room.participants > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full bg-success animate-pulse"></div>
                          <span className="text-success font-semibold">
                            {room.participants} active
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="card-actions justify-end mt-4 gap-2">
                      <button
                        onClick={() => copyRoomLink(room._id)}
                        className="btn btn-sm btn-ghost gap-2"
                        title="Copy room link"
                      >
                        <Copy className="size-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => joinRoom(room._id)}
                        className="btn btn-sm btn-primary gap-2"
                      >
                        <ExternalLink className="size-4" />
                        Join Room
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Link Section */}
        {isTeacher && rooms.length > 0 && (
          <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl flex items-center gap-2">
                <LinkIcon className="size-5" />
                Share Room Links
              </h2>
              <p className="text-sm opacity-70">
                Students can join by clicking the room link or navigating to the Rooms page
              </p>
              <div className="alert alert-info text-sm mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Anyone with the room link can join the video call. Share responsibly!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsPage;
