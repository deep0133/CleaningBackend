import {socketIdMap} from './socketHandler.js'
import {getSocketIO} from './socketConfig.js'

const sendNotification = (cleaners, notificationData) => {
    // Loop through the filtered list of cleaners
    const io = getSocketIO();
    cleaners.forEach((cleaner) => {
      const socketId = socketIdMap[cleaner._id]; // Get socket ID from the map
      if (socketId) {
        io.to(socketId).emit('newJobNotification', notificationData); // Send notification
        console.log(`Notification sent to cleaner ${cleaner.userId}:`, notificationData);
      } else {
        console.log(`Cleaner ${cleaner.userId} not connected.`);
      }
    });
  };
  
  export default sendNotification;