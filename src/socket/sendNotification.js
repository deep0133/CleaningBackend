import {socketIdMap} from './socketHandler.js'
import {getSocketIO} from './socketConfig.js'

const sendNotification = (cleaners, notificationData) => {
    // Loop through the filtered list of cleaners
  
console.log("................................send Notification is called .....................")
// console.log("cleaners...............",cleaners)
    const io = getSocketIO();
 
    const socketIds = Object.values(socketIdMap);
    for(let i=0;i<socketIds.length;i++){
      let socketId = socketIds[i];
      if (socketId) {
            io.to(socketId).emit('newJobNotification', notificationData); // Send notification
               console.log("notification  Data......",notificationData)
          } else {
            console.log(`Cleaner  not connected.`);
          }
    }

  };
  
  export default sendNotification;