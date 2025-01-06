import { User } from "../models/user.model.js";
import sendNotification from "../socket/sendNotification.js";
import { BookingService } from "../models/Client/booking.model.js";
import { NotificationModel } from "../models/Notification/notificationSchema.js";
import { socketIdMap } from "../socket/socketHandler.js";

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

export const findNearbyCleanersController = async (
  longitude,
  latitude,
  bookingId,
  requestedCategory
) => {
  // Validate input
  if (!longitude || !latitude) {
    console.log("Longitude and latitude are required");
    return false;
  }

  if (!bookingId) {
    // throw new ApiError(400, "Booking Id is required");
    console.log("Booking Id is required");
    return false;
  }

  // Verify geospatial index
  const indexes = await User.collection.indexes();
  const geoIndex = indexes.find((index) => index.key.location === "2dsphere");

  if (!geoIndex) {
    console.log("Geospatial index is missing. Creating index...");
    await User.collection.createIndex({ location: "2dsphere" });
    console.log("Geospatial index created successfully.");
  } else {
    console.log("Geospatial index exists.");
  }
  const maxRadius = 1000; // 10km in meters

  // Find nearby cleaners using $geoNear
  const nearbyCleaners = await User.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        distanceField: "distance",
        maxDistance: parseFloat(maxRadius),
        spherical: true,
        query: { role: "cleaner" },
      },
    },
    {
      $project: { _id: 1 },
    },
  ]);

  // const searching = await getNearbyCleaners(
  //   longitude,
  //   latitude,
  //   maxRadius,
  //   requestedCategory // single string value
  // );

  console.log(
    "Searching nearby cleaners data....................",
    nearbyCleaners
  );

  if (!nearbyCleaners) {
    console.log("-----------------No nearby cleaners found-----------------");
    return false;
  }

  const bookingDetail = await BookingService.findById(bookingId)
    .populate("User")
    .populate("PaymentId");
  console.log("-----------------bookingDetail...............");

  const notificationExists = await NotificationModel.findOne({
    bookingId: bookingId,
  });

  if (notificationExists) {
    console.log("Notification already sent to nearby cleaners");
    return false;
    // throw new ApiError(400, "Notification already sent to nearby cleaners");
  }

  const notificationData = {
    id: bookingId,
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

  console.log("------socketIdMap--------------: ", socketIdMap);
  console.log(
    "...................socketIds................",
    connectedCleanersIds
  );

  if (connectedCleanersKeys.length > 0) {
    sendNotification(nearbyCleaners, notificationData);
  }
  const cleanerIds = nearbyCleaners.map((cleaner) => cleaner._id.toString());

  const notifications = cleanerIds.map((cleanerId) => ({
    cleanerId,
    name: bookingDetail?.User?.name,
    address: bookingDetail.CartData[0].UserAddress,
    bookingId,
    message: "New cleaning request", // Mark as read if the cleaner is connected
    timestamp: bookingDetail.CartData[0].TimeSlot,
    isExpire: false,
  }));

  await NotificationModel.insertMany(notifications);

  console.log(
    "Notifications sent to nearby cleaners ------ length of nearby cleaner----:",
    nearbyCleaners.length
  );
  return true;
};

/**
 *   { _id: new ObjectId('677285beabce87038b668e4e') },
  { _id: new ObjectId('677285beabce87038b668e4a') },
  { _id: new ObjectId('677285beabce87038b668e52') },
  { _id: new ObjectId('677285beabce87038b668e4b') },
  { _id: new ObjectId('677285beabce87038b668e50') },
  { _id: new ObjectId('677285beabce87038b668e4d') }
 */
