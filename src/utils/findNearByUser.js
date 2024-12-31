
import { User } from "../models/user.model.js";
import sendNotification from "../socket/sendNotification.js";
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {BookingService} from '../models/Client/booking.model.js';
import {NotificationModel} from '../models/Notification/notificationSchema.js';

export const findNearbyCleaners = async (longitude,latitude) => {
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
            coordinates: [77.1025,28.7041]
          },
          distanceField: 'distance',
          maxDistance: parseFloat(10000), // 10km in meters
          spherical: true,
          query: { role: 'cleaner' }
        }
      }
    ]);



    console.log(`Number of nearby cleaners found: ${nearbyCleaners.length}`);

    if (nearbyCleaners.length === 0) {
      return res.status(404).json({
        message: "No nearby cleaners found",
      });
    }
        
       const notificationData = {
        message: "New cleaning request",
        address:"Delhi",
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
  try {
    const { longitude, latitude,
      // bookingId
     } = req.body;

    // Validate input
    if (!longitude || !latitude) {
      return res.status(400).json({
        message: "Longitude and latitude are required",
      });
    }
     
  //  if(!bookingId){
  //    throw new ApiError(400,'Booking Id is required');
  //   }
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
    const maxRadius = 10000; // 10km in meters

    // Find nearby cleaners using $geoNear
    const nearbyCleaners = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [77.1025,28.7041]
          },
          distanceField: 'distance',
          maxDistance: parseFloat(10000), // 10km in meters
          spherical: true,
          query: { role: 'cleaner' }
        }
      }
    ]);
  
    
    

   

    if (nearbyCleaners.length === 0) {
      return res.status(404).json({
        message: "No nearby cleaners found",
      });
    }

    console.log("---------Nearby------- cleaners----- found-------:", nearbyCleaners);

    // Notification data
    const notificationData = {
      //  bookingId,
       message: "New cleaning request",

    };

    // const booking = await BookingService.findById(bookingId);

    // if(!booking){
    //   throw new ApiError(404,'Booking not found');
    // }



    await NotificationModel.create({
      // cleanerId: nearbyCleaners[0]._id,
      // bookingId: bookingId,
      message: notificationData.message,
    });
    




    // Send notification to nearby cleaners
    sendNotification(nearbyCleaners, notificationData);

    return res.status(200).json({
      message: "Notifications sent to nearby cleaners",
      cleanersNotified: nearbyCleaners.length,
    });

  } catch (error) {
    console.error("Error finding nearby cleaners:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


