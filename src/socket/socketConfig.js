import { Server } from "socket.io";
import { handleSocketConnection } from "./socketHandler.js";
import { socketIdMap } from "./socketHandler.js";

let io;

const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  console.log("Socket.IO initialized!");
  console.log(".........socketIdsMap............",socketIdMap)

  handleSocketConnection(io);
};

const getSocketIO = () => {
  if (!io) throw new Error("Socket.IO not initialized!");
  return io;
};

export { initSocketServer, getSocketIO };
