import { Server } from "socket.io";
import { handleSocketConnection } from "./socketHandler.js";

let io;

const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  handleSocketConnection(io);
};

const getSocketIO = () => {
  if (!io) throw new Error("Socket.IO not initialized!");
  return io;
};

export { initSocketServer, getSocketIO };
