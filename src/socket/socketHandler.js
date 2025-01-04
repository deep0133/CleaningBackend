const socketIdMap = {};

const handleSocketConnection = (io) => {
  console.count(
    "............socket handler function is called.................."
  );

  io.on("connection", (socket) => {
    const data = {
      id: socket.id,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers["user-agent"],
    };
    console.count("a user connected............with socketId : ", data);
    socket.onAny((event) => {
      console.log(`Event received: ${event}`);
    });

    socket.on("user", () => {
      console.log("hii user welcome to the server");
    });

    // Register cleaner by cleanerId
    socket.on("register_cleaner", async (cleanerId) => {
      console.log(
        "...................cleaner get connected...........cleanerId......",
        cleanerId
      );
      if (cleanerId in socketIdMap) {
        console.log(
          `Cleaner ${cleanerId} is already connected. Updating socket ID.`
        );
      } else {
        console.log(
          `Cleaner ${cleanerId.toString()} is not connected. Adding to the list.`
        );
        socketIdMap[cleanerId.toString()] = socket.id;
      }
      // broadcast to everyone :
      io.emit(
        "notification",
        `Cleaner ${cleanerId} has registered. <><><><><><><><><><`
      );
      // const cleaner = await Cleaner.findOne({ user: cleanerId });
      // cleaner.isOnline = true;
      // await cleaner.save();
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(
        "user disconnected.............................................."
      );
      // Find and remove the cleaner who disconnected from the map
      let found = false;
      for (const [cleanerId, socketId] of Object.entries(socketIdMap)) {
        if (socketId === socket.id) {
          console.log(`Cleaner ${cleanerId} disconnected.`);
          // socketIdMap.delete(cleanerId);
          delete socketIdMap[cleanerId];
          // const cleaner = await Cleaner.findOne({ user: cleanerId });
          // cleaner.isOnline = false;
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

// ngrok http http://localhost:5911
