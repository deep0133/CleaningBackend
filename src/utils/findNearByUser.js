
import { User } from "../models/user.model.js";
import sendNotification from "../socket/sendNotification.js";
import { ApiError } from '../utils/apiError.js';
import { BookingService } from '../models/Client/booking.model.js';
import { NotificationModel } from '../models/Notification/notificationSchema.js';
import { socketIdMap } from '../socket/socketHandler.js';

export const findNearbyCleaners = async (longitude, latitude) => {
  try {


    // Validate input
    if (!longitude || !latitude) {
      return res.status(400).json({
        message: "Longitude and latitude are required",
      });
    }

    console.log("Finding nearby cleaners...");

    // Verify geospatial index
    const indexes = await User.collection.indexes();
    const geoIndex = indexes.find(index => index.key.location === '2dsphere');

    if (!geoIndex) {
      console.log("Geospatial index is missing. Creating index...");
      await User.collection.createIndex({ location: "2dsphere" });
      console.log("Geospatial index created successfully.");
    } else {
      console.log("Geospatial index exists.");
    }
    // 77.1025

    // 28.7041
    const maxRadius = 10000;
    // Find nearby cleaners using $geoNear
    const nearbyCleaners = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [77.1025, 28.7041]
          },
          distanceField: 'distance',
          maxDistance: parseFloat(10000), // 10km in meters
          spherical: true,
          query: { role: 'cleaner' }
        }
      }
    ]);



    console.log(`Number of nearby cleaners found: ${nearbyCleaners.length}`);
    console.log("socketIdMap data ", socketIdMap)

    if (nearbyCleaners.length === 0) {
      return res.status(404).json({
        message: "No nearby cleaners found",
      });
    }

    const notificationData = {
      message: "New cleaning request",
      address: "Delhi",
      duration: "2 hours",
      price: 200,
    }

    // Send notification to nearby cleaners

    sendNotification(nearbyCleaners, notificationData);

  } catch (error) {
    console.error("Error finding nearby cleaners:", error);

  }
};


export const findNearbyCleanersController = async (req, res) => {

    const { longitude, latitude,
      bookingId
    } = req.body;

    // Validate input
    if (!longitude || !latitude) {
      return res.status(400).json({
        message: "Longitude and latitude are required",
      });
    }

    if (!bookingId) {
      throw new ApiError(400, 'Booking Id is required');
    }



    // Verify geospatial index
    const indexes = await User.collection.indexes();
    const geoIndex = indexes.find(index => index.key.location === '2dsphere');

    if (!geoIndex) {
      console.log("Geospatial index is missing. Creating index...");
      await User.collection.createIndex({ location: "2dsphere" });
      console.log("Geospatial index created successfully.");
    } else {
      console.log("Geospatial index exists.");
    }
    const maxRadius = 10000; // 10km in meters

    // Find nearby cleaners using $geoNear
    const nearbyCleaners = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [77.1025, 28.7041]
          },
          distanceField: 'distance',
          maxDistance: parseFloat(10000), // 10km in meters
          spherical: true,
          query: { role: 'cleaner' }
        },

      },
      {
        $project: { _id: 1 }
      }

    ]);

    if (nearbyCleaners.length === 0) {
      return res.status(404).json({
        message: "No nearby cleaners found",
      });
    }


    const bookingDetail = await BookingService.findById(bookingId)
    console.log("bookingDetail...............", bookingDetail)
 

    

    const notificationExists = await NotificationModel.findOne({ bookingId: bookingId });

if(notificationExists){
  throw new ApiError(400, 'Notification already sent to nearby cleaners');
}

    const notificationData = {
      message: "New cleaning request",
      duration: bookingDetail.CartData[0].Duration,
      price: bookingDetail.CartData[0].TotalPrice,
      address: bookingDetail.CartData[0].UserAddress,
    }
    
    const connectedCleanersIds = Object.values(socketIdMap);
    console.log("...................socketIds................",connectedCleanersIds);

  

    if (Object.keys(socketIdMap).length>0) {
      sendNotification(nearbyCleaners, notificationData);
    }
    const cleanerIds = nearbyCleaners.map(cleaner => cleaner._id.toString());
    

    const notifications = cleanerIds.map((cleanerId) => ({
      cleanerId,
      bookingId,
      message: "New cleaning request",// Mark as read if the cleaner is connected
      timestamp: new Date(),
      isExpire: false,
    }));
     




    await NotificationModel.insertMany(notifications);


    return res.status(200).json({
      message: "Notifications sent to nearby cleaners",
      cleanersNotified: nearbyCleaners.length,
    });

  } 



