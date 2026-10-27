import { io } from "socket.io-client";
import { getToken } from "@/services/token";
import type {
  RealtimeHandlers,
  LiveOccupancyPayload,
  RealtimeAlertPayload,
} from "@/types/realtime-socket";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export function connectRealtime(
  handlers: RealtimeHandlers,
): (() => void) | null {
  if (!SOCKET_URL) {
    handlers.onStatusChange?.("disabled");
    return null;
  }

  const token = getToken();

  if (!token) {
    handlers.onStatusChange?.("error");
    return null;
  }

  const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    auth: { token },
  });

  handlers.onStatusChange?.("connecting");

  socket.on("connect", () => {
    handlers.onStatusChange?.("connected");
  });

  socket.on("disconnect", () => {
    handlers.onStatusChange?.("disconnected");
  });

  socket.on("live_occupancy", (payload: LiveOccupancyPayload) => {
    handlers.onLiveOccupancy?.(payload);
  });

  socket.on("alert", (payload: RealtimeAlertPayload) => {
    handlers.onAlert?.(payload);
  });

  socket.on("connect_error", (error) => {
    handlers.onStatusChange?.("error");
    console.error("Socket.IO connection failed:", error.message);
  });

  if (handlers.onLiveOccupancy) {
    socket.on("live_occupancy", handlers.onLiveOccupancy);
  }

  if (handlers.onAlert) {
    socket.on("alert", handlers.onAlert);
  }

  socket.connect();

  return () => {
    socket.removeAllListeners();
    socket.disconnect();
  };
}
