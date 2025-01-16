

import { socketIdMap } from "./socketHandler.js";
import { getSocketIO } from "./socketConfig.js";
import { BookingService } from "../models/Client/booking.model.js";
import { clientSocketIdMap } from "./socketHandler.js";

const sendNotification = async (cleaners, notificationData) => {

  console.log(
    "------------------------------------in sendNotification------------------------------"
  );


  // Initialize Socket.IO
  const io = getSocketIO();


  // Loop through the list of cleaners
  cleaners.forEach((cleaner) => {
    const cleanerId = cleaner._id.toString(); // Ensure `_id` is a string
    const socketId = socketIdMap[cleanerId]; // Get the socket ID for the cleaner
    console.log("---socketId---", socketId);

    if (socketId) {
      // Send notification if the cleaner is connected
      io.emit("job", "sending job notification to near by cleaners"); // Send notification
      io.to(socketId).emit("job_request", notificationData);
      console.log(
        `Notification sent to cleaner: ${cleanerId}`,
        notificationData
      );
    } else {
      console.log(`Cleaner not connected: ${cleanerId}`);
    }
  });
};

export default sendNotification;




export const sendNotificationToClient = (notificationData) => {

  const io = getSocketIO();
  const targetClientId = notificationData.clientId.toString(); 



  let socketId = null;
  for (const key in clientSocketIdMap) {
    try {
      const parsedKey = JSON.parse(key); 
      if (parsedKey.clientId === targetClientId) {
        socketId = clientSocketIdMap[key];
        break; 
      }
    } catch (error) {
      console.error("Error parsing key:", key, error.message);
    }
  }


  if (socketId) {
    io.to(socketId).emit("message", notificationData.message);
    console.log("Notification sent successfully.");
  } else {
    console.log("Socket ID not found for clientId:", targetClientId);
  }
};
