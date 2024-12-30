import { Cleaner } from "../models/Cleaner/cleaner.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
// export async function findNearbyCleaner(longitude, latitude) {
//     try {

//         // Find users with role 'cleaner' within the radius
//         const nearbyUsers = await User.find({
//             role: "cleaner",
//             location: {
//                 $near: {
//                     $geometry: {
//                         type: "Point",
//                         coordinates: [longitude, latitude],
//                     },
//                     $maxDistance: 10000 // 10 km radius
//                 },
//             },
//         }).select('_id'); // Select only user IDs

//         // Map user IDs to an array
//         return nearbyUsers.map(user => user._id);
//     } catch (error) {
//         console.log("error here ............")
//         console.error("Error finding nearby cleaner IDs:", error);
//         throw error;
//     }
// }

// // Example Usage
// const longitude =77.1025;
// const latitude = 28.7041;

// findNearbyCleaner(longitude, latitude)
//     .then(userIds => {
//         console.log("Nearby Cleaner IDs:", userIds);
//     })
//     .catch((err) =>

//         console.error("Error finding nearby cleaners:", err)
//     );

// export async function findNearbyCleaners(longitude, latitude, maxDistance = 10000) {
//   try {

//     const cleanerCount = await User.countDocuments({ role: 'cleaner' });
//     console.log(`Total number of cleaners in the database: ${cleanerCount}`);

//     // const cleanersWithLocation = await User.find({
//     //   role: 'cleaner',
//     //   'location.type': 'Point',
//     //   'location.coordinates': { $exists: true, $type: 'array', $ne: [] }
//     // });
//     // console.log(`Number of cleaners with valid location data: ${cleanersWithLocation.length}`);

//     const indexes = await User.collection.indexes();
//     const geoIndex = indexes.find(index => index.key.location === '2dsphere');
//     if (!geoIndex) {
//       console.log("Geospatial index is missing. Creating index...");
//       await User.collection.createIndex({ location: "2dsphere" });
//       console.log("Geospatial index created successfully.");
//     } else {
//       console.log("Geospatial index exists.");
//     }
//     const nearbyCleaners = await Cleaner.aggregate([
//       {
//         $geoNear: {
//           near: {
//             type: 'Point',
//             coordinates: [longitude, latitude]
//           },
//           distanceField: 'distance',
//           maxDistance: maxDistance, // 10km in meters
//           spherical: true
//         }
//       },
//       {
//         $match: {
//           role: 'cleaner'
//         }
//       },
//       {
//         $project: {
//           name: 1,
//           email: 1,
//           phoneNumber: 1,
//           address: 1,
//           distance: 1
//         }
//       }
//     ]);
//     console.log("nearbyCleaners",nearbyCleaners)

//     console.log(`Found ${nearbyCleaners.length} cleaners within ${maxDistance / 1000}km:`);
//     nearbyCleaners.forEach(cleaner => {
//       console.log(`- ${cleaner.name}: ${(cleaner.distance / 1000).toFixed(2)}km away`);
//     });

//     return nearbyCleaners;
//   } catch (error) {
//     console.error('Error finding nearby cleaners:', error);
//     throw error;
//   }
// }

// export async function findNearbyCleaners() {
//   try {
//     // 1. Check if there are any users with role 'cleaner'
//     // const cleanerCount = await User.countDocuments({ role: 'cleaner' });
//     // console.log(`Total number of cleaners in the database: ${cleanerCount}`);

//     // if (cleanerCount === 0) {
//     //   console.log("There are no users with the role 'cleaner'. Please add some cleaner users to the database.");
//     //   return;
//     // }

//     console.log("finding nearby cleaners..................////////////////////..........")

//     // 2. Check if cleaners have valid location data
//     const cleanersWithLocation= await User.find(
//       {
//         location: {
//            $nearSphere: {
//               $geometry: {
//                  type : "Point",
//                  coordinates : [ 73.9667, 28.78 ]
//               },

//               $maxDistance: 10000
//            }
//         }
//       }
//    )
//     console.log("cleanersWithLocation",cleanersWithLocation)
//     console.log(`Number of cleaners with valid location data: ${cleanersWithLocation.length}`);

//     if (cleanersWithLocation.length === 0) {
//       console.log("No cleaners have valid location data. Please update cleaner records with correct location information.");
//       return;
//     }

//     // 3. Verify geospatial index
//     const indexes = await User.collection.indexes();
//     const geoIndex = indexes.find(index => index.key.location === '2dsphere');

//     if (!geoIndex) {
//       console.log("Geospatial index is missing. Creating index...");
//       await User.collection.createIndex({ location: "2dsphere" });
//       console.log("Geospatial index created successfully.");
//     } else {
//       console.log("Geospatial index exists.");
//     }

//     // 4. Test a geospatial query
//     const testLongitude = 77.14673000000001;
//     const testLatitude = 28.73214;
//     const maxDistance = 10000; // 10km in meters

//     const nearbyCleaners = await User.aggregate([
//       {
//         $geoNear: {
//           near: {
//             type: 'Point',
//             coordinates: [testLongitude, testLatitude]
//           },
//           distanceField: 'distance',
//           maxDistance: maxDistance,
//           spherical: true,
//           query: { role: 'cleaner' }
//         }
//       }
//     ]);

//     console.log(`Number of nearby cleaners found: ${nearbyCleaners.length}`);

//     if (nearbyCleaners.length === 0) {
//       console.log("No nearby cleaners found. This could be due to:");
//       console.log("1. No cleaners within the specified radius");
//       console.log("2. Incorrect longitude/latitude values for the search");
//       console.log("3. Incorrect longitude/latitude values stored for cleaners");
//     } else {
//       console.log("Nearby cleaners:");
//       nearbyCleaners.forEach(cleaner => {
//         console.log(`- ${cleaner.name}: ${(cleaner.distance / 1000).toFixed(2)}km away`);
//       });
//     }

//   } catch (error) {
//     console.error('Error during debugging:', error);
//   } finally {
//     mongoose.disconnect();
//   }
// }

// export async function findNearbyCleaner(req, res) {
//   try {
//     // MongoDB geospatial query
//     const nearbyUsers = await User.find({
//       location: {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
//           },
//           $maxDistance: radiusInKm * 1000, // Convert km to meters
//         },
//       },
//     });
//   } catch (error) {}
// }

export const findNearbyCleaner = async (req, res) => {
  try {
    // 77.1025;
    // 28.7041;

    // Extract latitude, longitude, and radius from the request body
    // const { latitude, longitude, radiusInKm = 10 } = req.body;
    const longitude = 77.1025;
    const latitude = 28.7041;
    const radiusInKm = 10;
    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required.",
      });
    }

    // MongoDB geospatial query
    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
          },
          $maxDistance: radiusInKm * 1000, // Convert km to meters
        },
      },
    });

    res.status(200).json({
      message: "Nearby users fetched successfully.",
      data: nearbyUsers,
    });
  } catch (error) {
    console.error("Error fetching nearby users:", error);
    res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Example usage
// const userLongitude = 77.1236;
// const userLatitude = 28.6791;

// findNearbyCleaners(userLongitude, userLatitude)
//   .then(cleaners => {
//     // Process the results as needed
//   })
//   .catch(error => {
//     console.error('Failed to find nearby cleaners:', error);
//   });
