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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Services",
        required: true,
      },
    ],
    availability: {
      type: Boolean,
      default: true,
    },
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    review: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
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
    startBooking: {
      type: Date,
    },

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountDetail",
    },
    routingNumber: String,
    verifyByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Cleaner = mongoose.model("cleaner", cleaner);
