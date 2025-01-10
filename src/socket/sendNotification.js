// import {socketIdMap} from './socketHandler.js'
// import {getSocketIO} from './socketConfig.js'

// const sendNotification = (cleaners, notificationData) => {
//     // Loop through the filtered list of cleaners

// console.log("................................send Notification is called .....................")
// // console.log("cleaners...............",cleaners)
//     const io = getSocketIO();

//     const socketIds = Object.values(socketIdMap);
//     for(let i=0;i<socketIds.length;i++){
//       let socketId = socketIds[i];
//       if (socketId) {
//             io.to(socketId).emit('newJobNotification', notificationData); // Send notification
//                console.log("notification  Data......",notificationData)
//           } else {
//             console.log(`Cleaner  not connected.`);
//           }
//     }

//   };

import { socketIdMap } from "./socketHandler.js";
import { getSocketIO } from "./socketConfig.js";
import { BookingService } from "../models/Client/booking.model.js";


const sendNotification = async (cleaners, notificationData) => {
  const booking = await BookingService.findById(notificationData.id);
   

  if (booking?.BookingStatus === "confirm") {
    console.log("Booking already accepted. Notifications skipped.");
    return;
  }

  console.log(
    "................................sendNotification is called....................."
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
    "------------------------------------------------------------------"
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
