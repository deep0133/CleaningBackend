


const socketIdMap = new Map();


const handleSocketConnection = (io) => {
 console.log("............socket handler function is called..................")

  io.on("connection", (socket) => {
    
    socket.onAny((event) => {
      console.log(`Event received: ${event}`);
    });

    socket.on("user",()=>{
      console.log("hii user welcome to the server")
    })

    // Register cleaner by cleanerId
    socket.on("register_cleaner", (cleanerId) => {

         console.log("...................cleaner get connected.................")
         if (socketIdMap.has(cleanerId)) {
          console.log(`Cleaner ${cleanerId} is already connected. Updating socket ID.`);
        }
      // socketIdMap[cleanerId] = socket.id;
      socketIdMap.set(cleanerId, socket.id);
      

      io.emit("notification", `Cleaner ${cleanerId} has registered. <><><><><><><><><><`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("user disconnected..............................................")
      // Find and remove the cleaner who disconnected from the map
      let found = false;
      for (const [cleanerId, socketId] of socketIdMap.entries()) {
        if (socketId === socket.id) {
          console.log(`Cleaner ${cleanerId} disconnected.`);
          socketIdMap.delete(cleanerId);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log("Disconnected socket was not associated with any cleaner.");
      }
      io.emit("notification", "A cleaner has disconnected.");
    });
  });
};

export { handleSocketConnection, socketIdMap };

