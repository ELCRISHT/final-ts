import { io } from "socket.io-client";

// If deployed separately, replace "/" with your backend URL (e.g. "https://my-api.onrender.com")
const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
});