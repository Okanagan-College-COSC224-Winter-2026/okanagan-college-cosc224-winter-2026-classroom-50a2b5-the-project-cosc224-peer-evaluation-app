import { io, Socket } from "socket.io-client";

const BASE_URL = "http://localhost:5000";

let socket: Socket | null = null;
let joinedUserId: number | null = null;

export function connectSocket(userId: number): Socket {
  if (!socket) {
    socket = io(BASE_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[socket] connected, sid:", socket?.id);
      if (joinedUserId) {
        socket?.emit("join", { user_id: joinedUserId });
        console.log("[socket] joined room user_" + joinedUserId);
      }
    });

    socket.on("disconnect", () => {
      console.log("[socket] disconnected");
    });
  }

  // Track which user room to join (also handles reconnects)
  if (joinedUserId !== userId) {
    joinedUserId = userId;
    if (socket.connected) {
      socket.emit("join", { user_id: userId });
      console.log("[socket] joined room user_" + userId);
    }
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    joinedUserId = null;
  }
}
