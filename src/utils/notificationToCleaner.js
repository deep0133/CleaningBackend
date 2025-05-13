// import io from "../index.js";
// import NotificationModel from "../models/Notification/notificationSchema.js";
// import { Cleaner } from "../models/Cleaner/cleaner.model.js";
// import { asyncHandler } from "./asyncHandler.js";

// const activeCleaners = new Map(); // In-memory store for online cleaners
// // const socket = io.connect("http://localhost:8080");

// io.on("connection", (socket) => {
//   console.log("Cleaner connected:", socket.id);

//   // Register cleaner : set cleaner -- online : true
//   socket.on(
//     "online",
//     asyncHandler(async ({ cleanerId, location, category }) => {
//       activeCleaners.set(cleanerId, {
//         socketId: socket.id,
//         location,
//         category,
//       });

//       // Update database: Cleaner is online
//       await Cleaner.findByIdAndUpdate(cleanerId, { isOnline: true });
//     })
//   );

//   // Handle disconnection : set cleaner --- online : false
//   socket.on(
//     "disconnect",
//     asyncHandler(async () => {
//       const disconnectedCleaner = [...activeCleaners].find(
//         ([key, value]) => value.socketId === socket.id
//       );
//       if (disconnectedCleaner) {
//         const cleanerId = disconnectedCleaner[0];
//         activeCleaners.delete(cleanerId);

//         // Update database: Cleaner is offline
//         await Cleaner.findByIdAndUpdate(cleanerId, { isOnline: false });
//         console.log("Cleaner disconnected:", cleanerId);
//       }
//     })
//   );
// });

// export const sendNotificationToCleaner = async (cleaner, booking) => {
//   // Check if the booking is accepted by another cleaner
//   const existingBooking = await BookingService.findOne({
//     _id: booking._id,
//     Cleaner: { $ne: cleaner._id }, // Exclude the cleaner
//   });

//   if (existingBooking && existingBooking.BookingStatus) {
//     console.log(
//       "Notification not sent: Booking already accepted by another cleaner"
//     );
//     return;
//   }

//   // Notification expiration logic
//   const notificationExpiry = booking.TimeSlot.start;
//   const currentTime = new Date();

//   if (currentTime > notificationExpiry) {
//     console.log("Notification expired and not sent");
//     return;
//   }

//   if (cleaner.isOnline) {
//     // Cleaner is online: Send real-time notification
//     const cleanerSocket = activeCleaners.get(cleaner._id.toString());
//     if (cleanerSocket) {
//       io.to(cleanerSocket.socketId).emit("newBooking", {
//         bookingId: booking._id,
//         bookingDetails: booking,
//       });
//       console.log(`Real-time notification sent to Cleaner ${cleaner._id}`);
//     }

//     // Cleaner is offline: Save notification to the database
//     await NotificationModel.create({
//       cleanerId: cleaner._id,
//       bookingId: booking._id,
//       message: "New booking available",
//       isRead: false,
//       timestamp: new Date(),
//       isExpire: false,
//     });
//     console.log(`Notification saved for offline Cleaner ${cleaner._id}`);
//   }
// };

// export const readNotification = asyncHandler(async (req, res) => {
//   const { notificationId } = req.params;

//   const notification = await NotificationModel.findById(notificationId);

//   if (!notification) {
//     return res
//       .status(404)
//       .json({ success: false, message: "Notification not found" });
//   }

//   notification.isRead = true;
//   await notification.save();

//   res.status(200).json({ success: true, notification });
// });
