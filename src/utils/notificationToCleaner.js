import io from "socket.io";

export const sendNotificationToCleaner = (cleaner, booking) => {
  // Example of using Socket.IO to send a real-time notification
  const socket = io.connect("http://localhost:3000"); // Replace with your socket server URL
  socket.emit("new-booking", {
    cleanerId: cleaner._id,
    bookingDetails: booking,
  });
};
