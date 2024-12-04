import mongoose from "mongoose";

const bookingSchema = mongoose.Schema(
  {
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  },
  {
    timestamps: true,
  }
);

export const BookingService = mongoose.model("Booking", bookingSchema);
