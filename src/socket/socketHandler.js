import { parse } from "dotenv";
import { User } from "../models/user.model.js";
import { json } from "express";

const socketIdMap = {};
const clientSocketIdMap = {};

const handleSocketConnection = (io) => {
  console.count(
    "............socket handler function is called.................."
  );

  io.on("connection", (socket) => {

    socket.onAny((event) => {
      console.log(`Event received: ${event}`);
    });

    socket.on("register_client", async (clientId) => {
      clientSocketIdMap[clientId.toString()] = socket.id;
      console.log("-----------------------clientSocketId---------",clientSocketIdMap)
     
      console.log("hii user welcome to the server",socket.id);
    });

    // Register cleaner by cleanerId
    socket.on("register_cleaner", async (data) => {
      const cleanerData = JSON.parse(data);
      const { cleanerId, location } = cleanerData;
      console.log(
        "...................cleaner get connected...........cleanerId......",
        cleanerId
      );
      console.log(location.coordinates);

      if (
        !location ||
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2
      ) {
        console.error(
          "Invalid location data. Expected: { type: 'Point', coordinates: [longitude, latitude] }"
        );
        return;
      }

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
      try {
        // Update cleaner's location in the database
        const cleaner = await User.findOne({ _id: cleanerId, role: "cleaner" });
        if (cleaner) {
          cleaner.location = location; // Update the location
          await cleaner.save();
          console.log(`Location updated for cleaner ${cleanerId}:`, location);
        } else {
          console.error(`Cleaner with ID ${cleanerId} not found.`);
        }
      } catch (error) {
        console.error(
          `Error updating location for cleaner ${cleanerId}:`,
          error
        );
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
      console.log("User disconnected.");
    
      // Find and remove the cleaner who disconnected from the map
      let cleanerFound = false;
      for (const [cleanerId, socketId] of Object.entries(socketIdMap)) {
        if (socketId === socket.id) {
          console.log(`Cleaner ${cleanerId} disconnected.`);
          delete socketIdMap[cleanerId];
          cleanerFound = true;
          break;
        }
      }
    
      // Find and remove the client who disconnected from the map
      let clientFound = false;
      for (const [clientId, socketId] of Object.entries(clientSocketIdMap)) {
        if (socketId === socket.id) {
          console.log(`Client ${clientId} disconnected.`);
          delete clientSocketIdMap[clientId];
          clientFound = true;
          break;
        }
      }
    
      // Logs if the disconnected socket wasn't associated with any user
      if (!cleanerFound) {
        console.log("Disconnected socket was not associated with any cleaner.");
      }
      if (!clientFound) {
        console.log("Disconnected socket was not associated with any client.");
      }
    
      // Emit notification to all connected clients
      io.emit("notification", "A user has disconnected");
    });
    



  });
};

export { handleSocketConnection, socketIdMap,clientSocketIdMap };

// ngrok http http://localhost:5911
