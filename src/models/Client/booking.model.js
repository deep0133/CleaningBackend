import mongoose from "mongoose";

const bookingSchema = mongoose.Schema(
  {
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Cleaner: {
      // accepted cleaner id
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cleaner",
    },
    category: {
      type: String,
      enum: ["basic cleaning", "deep cleaning"],
      required: true,
    },
    PaymentMethod: {
      type: String,
      required: true,
      enum: ["card", "cash", "online"],
    },
    PaymentValue: {
      type: String,
    },
    PaymentStatus: {
      type: String,
      required: true,
      enum: ["paid", "pending", "failed"],
    },
    BookingStatus: {
      type: Boolean,
      required: true,
    },
    TimeSlot: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    OTP: {
      start: { type: String },
      end: { type: String },
    },
    Duration: {
      type: Number, // in minutes
    },
    TotalPrice: {
      type: Number,
    },
    UserAddress: {
      type: String,
    },
    Duration: {
      type: Number, // in minutes
    },
    TotalPrice: {
      type: Number,
    },
    UserAddress: {
      type: String,
    },
    Location: {
      type: {
        type: String, // Always 'Point'
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  {
    timestamps: true,
  }
);

export const BookingService = mongoose.model("Booking", bookingSchema);
