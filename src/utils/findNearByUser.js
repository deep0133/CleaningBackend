import { User } from "../models/user.model.js";
import { Cleaner } from "../models/Cleaner/cleaner.model.js";
import sendNotification from "../socket/sendNotification.js";
import { BookingService } from "../models/Client/booking.model.js";
import { NotificationModel } from "../models/Notification/notificationSchema.js";
import { socketIdMap } from "../socket/socketHandler.js";
import mongoose from "mongoose";

export const findNearbyCleanersController = async (
  longitude,
  latitude,
  bookingId
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
  const bookingDetail = await BookingService.findById(bookingId).populate({
    path: "CartData.categoryId",
    select: "name",
  });

  const category = bookingDetail.CartData[0].categoryId._id;

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
        from: "cleaners", // Ensure  this matches the name of the collection storing cleaner details
        localField: "_id", // Match   User's _id to Cleaner references
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

  if (notificationExists) {
    console.log("Notification already sent to nearby cleaners");
    return false;
  }

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
  await NotificationModel.insertMany(notifications);
  return true;
};
