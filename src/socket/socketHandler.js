


 const socketIdMap = {}; 


const handleSocketConnection = (io) => {
 console.log("")
  console.log(socketIdMap);
  io.on("connection", (socket) => {
    
    socket.onAny((event, ...args) => {
      console.log(`Event received: ${event}`, args);
    });

    socket.on("user",()=>{
      console.log("hii user welcome to the server")
    })

    // Register cleaner by cleanerId
    socket.on("register_cleaner", (cleanerId) => {

       console.log("first cleanerId");

      console.log(`Cleaner ${cleanerId} registered.`);

      // Store the socket ID for this cleaner in the socketIdMap
      socketIdMap[cleanerId] = socket.id;
      console.log("socketIdMap..",socketIdMap);
          
      
      // Notify all connected clients when a new cleaner registers
      io.emit("notification", `Cleaner ${cleanerId} has registered.`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("user disconnected..............................................")
      // Find and remove the cleaner who disconnected from the map
      for (const cleanerId in socketIdMap) {
        if (socketIdMap[cleanerId] === socket.id) {
          console.log(`Cleaner ${cleanerId} disconnected.`);
          delete socketIdMap[cleanerId]; // Remove the cleaner from socketIdMap
          break;
        }
      }

      // Notify all connected clients when a cleaner disconnects
      io.emit("notification", "A cleaner has disconnected.");
    });
  });
};

export { handleSocketConnection, socketIdMap };

