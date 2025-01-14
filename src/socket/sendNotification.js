

import { socketIdMap } from "./socketHandler.js";
import { getSocketIO } from "./socketConfig.js";
import { BookingService } from "../models/Client/booking.model.js";

const sendNotification = async (cleaners, notificationData) => {
  console.log(
    "------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------in sendNotification------------------------------"
  );
  console.log(
    "------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------"
  );

  // Initialize Socket.IO
  const io = getSocketIO();
  console.log("............socketMap...............", socketIdMap);

  console.log("............cleaners...............", cleaners);
  console.log("---------------notificationData---------",notificationData)

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
