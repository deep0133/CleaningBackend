import mongoose from "mongoose";
import { Schema } from "mongoose";


const cleaner = new Schema(
  {
    // userID
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // serviceType
    category: [
      {
        type: String,
        required: true,
        default: "deep Cleaning",
      },
    ],
    availability: {
      type: Boolean,
      default: true, // Indicates if the cleaner is currently available for bookings
    },
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking", // Reference to the current booking they are working on
    },

    rating: {
      type: Number,
      default: 0, // Average rating from user feedback
    },
    totalBookings: {
      type: Number,
      default: 0, // Total number of bookings handled by this cleaner
    },
    completedBookings: {
      type: Number,
      default: 0, // Number of successfully completed bookings
    },
    earnings: {
      type: Number,
      default: 0, // Total earnings from bookings
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);





// {
//   "user": "658e9324b78f890001000001", // Replace with a real User ObjectId from your database
//   "category": ["deep Cleaning", "standard Cleaning"],
//   "location": {
//     "type": "Point",
//     "coordinates": [
//       77.12345, // Longitude
//       28.67890  // Latitude
//     ]
//   },
//   "availability": true,
//   "currentBooking": "658e9456c89g900002000002", // Optional: A Booking ObjectId
//   "otp": "123456", // Optional
//   "rating": 4.5, // Optional
//   "totalBookings": 10, // Optional
//   "completedBookings": 8, // Optional
//   "earnings": 5000 // Optional
// }

export const Cleaner = mongoose.model("cleaner", cleaner);
