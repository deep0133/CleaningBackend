import { User } from "../models/user.model.js";
import { BookingService } from "../models/Client/booking.model.js";

const socketIdMap = {};
const clientSocketIdMap = {};

const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    // socket.onAny((event) => {
    //   console.log(`Event received: ${event}`);
    // });
    console.count("---incomming socket connetion-----");
    socket.on("register_client", async (data) => {
      try {
        console.log("--------Register Socket ----:---:", data);
        // Parse the incoming data
        const parsedData = JSON.parse(data);

        // Map client ID to the socket ID
        clientSocketIdMap[parsedData.clientId.toString()] = socket.id;

        // Extract clientId
        let Id = parsedData.clientId;

        // Find booking associated with the clientId
        const booking = await BookingService.findOne({ User: Id });

        if (!booking) {
          console.log(`No booking found for client ID: ${Id}`);
          return;
        }

        const { location } = parsedData;

        try {
          const client = await User.findOne({ _id: Id, role: "client" });

          if (client) {
            client.location = location;
            await client.save();
          } else {
            console.error(`client with ID ${Id} not found.`);
          }
        } catch (dbError) {
          console.error(`Error updating location for client ${Id}:`, dbError);
        }

        // Check booking status and emit a message if confirmed
        if (booking.BookingStatus === "Confirm") {
          if (Id) {
            io.to(socket.id).emit(
              "booking_status",
              "Your booking has been accepted!"
            );
          }
        } else {
          console.log(`Booking status for client ID ${Id} is not Confirm.`);
        }
      } catch (error) {
        console.error("Error in register_client event:", error.message);
      }
    });

    socket.on("register_cleaner", async (data) => {
      try {
        let cleanerData;
        try {
          // cleanerData = JSON.parse(data);
          cleanerData = data;
        } catch (err) {
          console.error("Failed to parse data. Ensure it's valid JSON:", err);
          return;
        }

        const { cleanerId, location } = cleanerData;

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
          const cleaner = await User.findOne({
            _id: cleanerId,
            role: "cleaner",
          });
          if (cleaner) {
            cleaner.location = location; // Update the location
            await cleaner.save();
          } else {
          }
        } catch (dbError) {
          console.error(
            `Error updating location for cleaner ${cleanerId}:`,
            dbError
          );
        }

        try {
          // Broadcast to everyone
          io.emit(
            "notification",
            `Cleaner ${cleanerId} has registered. <><><><><><><><><><`
          );
        } catch (broadcastError) {
          console.error(
            "Error broadcasting notification for cleaner registration:",
            broadcastError
          );
        }
      } catch (mainError) {
        console.error(
          "Unexpected error in register_cleaner event handler:",
          mainError
        );
      }
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

export { handleSocketConnection, socketIdMap, clientSocketIdMap };

// ngrok http http://localhost:5911
