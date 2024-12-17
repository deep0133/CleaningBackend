import { io } from "../../index.js";

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
