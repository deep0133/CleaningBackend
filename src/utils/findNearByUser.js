import { User } from "../models/user.model.js";
import { Cleaner } from "../models/Cleaner/cleaner.model.js";
import sendNotification from "../socket/sendNotification.js";
import { BookingService } from "../models/Client/booking.model.js";
import { NotificationModel } from "../models/Notification/notificationSchema.js";
import { socketIdMap } from "../socket/socketHandler.js";
import mongoose from "mongoose";

// const findNearbyCleaners = async (longitude, latitude) => {
//   try {
//     // Validate input
//     if (!longitude || !latitude) {
//       return res.status(400).json({
//         message: "Longitude and latitude are required",
//       });
//     }

//     console.log("Finding nearby cleaners...");

//     // Verify geospatial index
//     const indexes = await User.collection.indexes();
//     const geoIndex = indexes.find((index) => index.key.location === "2dsphere");

//     if (!geoIndex) {
//       console.log("Geospatial index is missing. Creating index...");
//       await User.collection.createIndex({ location: "2dsphere" });
//       console.log("Geospatial index created successfully.");
//     } else {
//       console.log("Geospatial index exists.");
//     }
//     // 77.1025

//     // 28.7041
//     const maxRadius = 10000000;
//     // Find nearby cleaners using $geoNear
//     const nearbyCleaners = await User.aggregate([
//       {
//         $geoNear: {
//           near: {
//             type: "Point",
//             coordinates: [77.1025, 28.7041],
//           },
//           distanceField: "distance",
//           maxDistance: parseFloat(maxRadius), // 10km in meters
//           spherical: true,
//           query: { role: "cleaner" },
//         },
//       },
//     ]);

//     console.log(
//       `=====================================================Number of nearby cleaners found: ${nearbyCleaners.length}`
//     );
//     console.log("socketIdMap data ", socketIdMap);

//     if (nearbyCleaners.length === 0) {
//       return res.status(404).json({
//         message: "No nearby cleaners found",
//       });
//     }

//     const notificationData = {
//       message: "New cleaning request",
//       address: "Delhi",
//       duration: "2 hours",
//       price: 200,
//     };

//     // Send notification to nearby cleaners

//     sendNotification(nearbyCleaners, notificationData);
//   } catch (error) {
//     console.error("Error finding nearby cleaners:", error);
//   }
// };

// const getNearbyCleaners = async (
//   longitude,
//   latitude,
//   maxRadius,
//   requestedCategory
// ) => {
//   try {
//     // Validate input coordinates
//     if (!longitude || !latitude || !maxRadius) {
//       throw new Error("Longitude, latitude, and maxRadius are required.");
//     }

//     // Find nearby cleaners
//     const nearbyCleaners = await User.aggregate([
//       {
//         $geoNear: {
//           near: {
//             type: "Point",
//             coordinates: [longitude, latitude],
//           },
//           distanceField: "distance", // Field to store calculated distance
//           maxDistance: parseFloat(maxRadius), // Maximum distance in meters
//           spherical: true, // Use spherical calculation
//           query: {
//             role: "cleaner", // Only users with the role of cleaner
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "cleaners", // Reference the 'Cleaner' collection
//           localField: "_id", // `_id` field in User schema
//           foreignField: "user", // `user` field in Cleaner schema
//           as: "cleanerDetails", // Add cleaner details to the output
//         },
//       },
//       {
//         $unwind: "$cleanerDetails", // Unwind the `cleanerDetails` array
//       },
//       {
//         $match: {
//           "cleanerDetails.verifyByAdmin": true, // Only verified cleaners
//           "cleanerDetails.category": requestedCategory, // Match the requested service type
//         },
//       },
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           email: 1,
//           phoneNumber: 1,
//           distance: 1, // Include calculated distance
//           "cleanerDetails.category": 1,
//           "cleanerDetails.rating": 1,
//         },
//       },
//     ]);

//     // Handle the case where no cleaners are found
//     if (!nearbyCleaners || nearbyCleaners.length === 0) {
//       return {
//         success: false,
//         message: "No cleaners found within the specified radius.",
//       };
//     }

//     return {
//       success: true,
//       message: "Nearby cleaners retrieved successfully.",
//       cleaners: nearbyCleaners,
//     };
//   } catch (error) {
//     console.error("Error retrieving nearby cleaners:", error.message);
//     return {
//       success: false,
//       message: "Error retrieving nearby cleaners.",
//     };
//   }
// };

export const findNearbyCleanersController = async (longitude,
  latitude,
  bookingId
) => {
  // Validate input
  if (!longitude || !latitude) {
    console.log("Longitude and latitude are required");
    return false;
  }
    

   console.log("-------in findnear by cleaner----");

  if (!bookingId) {
    // throw new ApiError(400, "Booking Id is required");
    console.log("Booking Id is required");
    return false;
  }
  console.log("-------------bookingId at findNearByCleaner------------",bookingId);
  const bookingDetail = await BookingService.findById(bookingId).populate({
    path: "CartData.categoryId",
    select: "name",
  });

  const category =  bookingDetail.CartData[0].categoryId._id;
  

  // Verify geospatial index
  const indexes = await User.collection.indexes();
  const geoIndex = indexes.find((index) => index.key.location === "2dsphere");

  if (!geoIndex) {
    await User.collection.createIndex({ location: "2dsphere" });
  } else {
    console.log("Geospatial index exists.");
  }
  const maxRadius = 1000; // 10km in meters

  // Find nearby cleaners using $geoNear

  console.log(
    "---------------------------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------category---------------------------------------------",
    category
  );
  console.log(
    "---------------------------------------------------------------------------------------"
  );

 

  const nearbyCleaners = await User.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        distanceField: "distance", // This will return the distance of each result from the point
        maxDistance: parseFloat(maxRadius), // Specify the max distance here
        spherical: true, // Set to true for GeoJSON data
        query: {
          role: "cleaner", // Filter by role (cleaner)
        },
      },
    },
    {
      $lookup: {
        from: "cleaners",     // Ensure  this matches the name of the collection storing cleaner details
        localField: "_id",    // Match   User's _id to Cleaner references
        foreignField: "user", // Assume  Cleaner has a 'user' field referencing User _id
        as: "cleanerDetails", // Name of the array in the result
      },
    },
    {
      $unwind: "$cleanerDetails", // Unwind the cleanerDetails array
    },
    {
      $match: {
        "cleanerDetails.category": {
          $in: [category], // Filter by the provided category
        },
      },
    },
    {
      $project: {
        _id: 1, // Project the fields you need
        "cleanerDetails.name": 1,
        "cleanerDetails.category": 1,
        distance: 1,
      },
    },
  ]);
  
  console.log(
    "Searching nearby cleaners data length....................",
    nearbyCleaners?.length
  );
  
  if (!nearbyCleaners) {
    console.log("-----------------No nearby cleaners found-----------------");
    return false;
  }

  const notificationExists = await NotificationModel.findOne({
    bookingId: bookingId,
  });
  console.log("------------notification exists-----------",notificationExists);

  if (notificationExists) {
    console.log("Notification already sent to nearby cleaners");
    return false;
  }

  console.log("-------------bookingId--at-findNearByCleaner----------",bookingId);

  const notificationData = {
    bookingId: bookingId,
    name: bookingDetail?.User?.name,
    jobType: bookingDetail.CartData[0].categoryId,
    location: bookingDetail.CartData[0].UserAddress,
    dateTime: bookingDetail.CartData[0].TimeSlot,
    price: bookingDetail.PaymentId.PaymentValue,
    message: "New cleaning request",
  };

  // const connectedCleanersIds = Object.values(socketIdMap);
  const connectedCleanersIds = Object.values(socketIdMap); // Get all values
  const connectedCleanersKeys = Object.keys(socketIdMap);

  console.log("................socketIdMap...............................",socketIdMap);
  console.log("--------------connectedCleanersKeys----------------------:",connectedCleanersKeys);
  console.log(".....................notificationData.....................",notificationData);

  if (connectedCleanersKeys.length > 0) {
    sendNotification(nearbyCleaners, notificationData);
  }
  const cleanerIds = nearbyCleaners.map((cleaner) => cleaner._id.toString());

    

  const notifications = cleanerIds.map((cleanerId) => ({
    cleanerId,
    name: bookingDetail?.User?.name,
    address: bookingDetail.CartData[0].UserAddress,
    bookingId: bookingId,
    message: "New cleaning request", // Mark as read if the cleaner is connected
    timestamp: bookingDetail.CartData[0].TimeSlot,
    isExpire: false,
  }));
console.log("-------------------notifications at findNearBycleaners-------------------",notifications);
  await NotificationModel.insertMany(notifications);
  return true;
};
