import mongoose from "mongoose";
import { Schema } from "mongoose";

const cleaner = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    category: [
      {
        type: String,
        required: true,
        default: "deep Cleaning",
      },
    ],
    location: {
      type: {
        type: String, // Always "Point"
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    availability: {
      type: Boolean,
      default: true, // Indicates if the cleaner is currently available for bookings
    },
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking", // Reference to the current booking they are working on
    },
    otp: {
      type: String, // OTP for booking verification
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
    isOnline: Boolean,
  },
  {
    timestamps: true,
  }
);

export const Cleaner = mongoose.model("cleaner", cleaner);
