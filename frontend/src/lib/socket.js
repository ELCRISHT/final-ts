import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});