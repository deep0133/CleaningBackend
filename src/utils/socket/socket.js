import { io } from "../../index.js";

io.on("connection", (socket) => {
  // When a cleaner is notified
  socket.on("sendNotification", (cleanerId, bookingDetails) => {
    // Emit event to the cleaner's socket ID
    io.to(cleanerId).emit("newBooking", bookingDetails);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
