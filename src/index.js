import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";
import { Server } from "socket.io";

import http from "http";

const server = http.createServer(app);

dotenv.config({
  path: "./.env",
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // When a cleaner is notified
  socket.on("sendNotification", (cleanerId, bookingDetails) => {
    // Emit event to the cleaner's socket ID
    console.log("-------check socket---");
    io.to(cleanerId).emit("newBooking", bookingDetails);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

io.on("connection_error", (err) => {
  console.error("Socket connection error:", err.message);
});

connectDB()
  .then(
    server.listen(process.env.PORT, () => {
      console.log("Server is listening at port", process.env.PORT);
    })
  )
  .catch((err) => {
    console.log("Database connection failed !!!!", err);
  });
