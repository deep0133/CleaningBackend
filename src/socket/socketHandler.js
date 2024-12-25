const handleSocketConnection = (io,cleanerId) => {
    io.on("connection", (socket) => {
      console.log(`New client connected: ${socket.id}`);
  
      // Notify all connected clients when a new cleaner registers
      socket.on("register_cleaner", (cleanerId) => {
        console.log(`Cleaner ${cleanerId} registered.`);
        
        // Broadcast a notification to all connected sockets
        io.emit("notification", `Cleaner ${cleanerId} has registered.`);
      });
  
      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        io.emit("notification", `A cleaner has disconnected.`);
      });
    });
  };
  
  export { handleSocketConnection };
  