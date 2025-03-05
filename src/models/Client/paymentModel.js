import mongoose from "mongoose";

const paymentSchema = mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  // Payment Details
  PaymentMethod: {
    type: String,
    default: "online",
    enum: ["card", "cash", "online"],
  },
  PaymentValue: { type: String },
  PaymentStatus: {
    type: String,
    required: true,
    enum: [
      "amount_capturable", // Payment is authorized but not captured
      "canceled", // Booking/payment was canceled
      "created", // Booking is created but no payment initiated
      "refunded",
      "partially_funded", // Partially paid
      "failed", // Payment attempt failed
      "processing", // Payment is in progress
      "paid", // Fully paid
    ],
  },
  stripeOrderId: { type: String, required: true },
  stripeClientSecerat: { type: String },
  // If using Stripe or Razorpay
  refundId: String,
  refundAmount: Number,
});

export const PaymentModel = mongoose.model("Payment", paymentSchema);
