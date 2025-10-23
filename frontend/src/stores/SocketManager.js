import { io } from "socket.io-client";
import { toast } from "react-toastify";

let socket;

export const connectSocket = () => {
  if (!socket) {
    socket = io(`${import.meta.env.VITE_BASE_URL}`, {
      reconnectionAttempts: 2, // retry 5 times
      reconnectionDelay: 2000, // wait 2s between retries
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection failed:", error);
      toast.error("Real-time updates unavailable");
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
