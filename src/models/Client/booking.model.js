import mongoose from "mongoose";

const bookingSchema = mongoose.Schema(
  {
    User: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    Cleaner: { type: mongoose.Schema.Types.ObjectId, ref: "Cleaner" },
    category: {
      type: String,
      required: true,
    },
    PaymentMethod: {
      type: String,
      required: true,
      enum: ["card", "cash", "online"],
    },
    PaymentValue: { type: String },
    PaymentStatus: {
      type: String,
      required: true,
      enum: ["paid", "pending", "failed"],
    },
    BookingStatus: { type: Boolean, required: true }, // when accepted : true
    TimeSlot: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    OTP: { start: { type: String }, end: { type: String } },
    Duration: { type: Number },
    TotalPrice: { type: Number },
    stripeBookingId: {
      type: String,
    }, // Razorpay order ID (if online payment)
    // razorpayPaymentId: { type: String }, // Razorpay payment ID (on verification)
    // razorpaySignature: { type: String }, // Razorpay signature (on verification)
    UserAddress: { type: String },
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
