import { io } from "socket.io-client";

// If deployed separately, replace "/" with your backend URL
const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : import.meta.env.MODE === "development" 
    ? "http://localhost:5001" 
    : "/";

// Create socket instance without connecting immediately
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

// Helper function to connect with user info
export const connectSocket = (user) => {
  if (user && !socket.connected) {
    socket.io.opts.query = {
      userId: user._id,
      userName: user.fullName,
      userImage: user.profilePic,
      userRole: user.role
    };
    socket.connect();
  }
};

// Helper function to disconnect
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};