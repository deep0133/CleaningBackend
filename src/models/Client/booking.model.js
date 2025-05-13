import mongoose from "mongoose";

const bookingSchema = mongoose.Schema(
  {
    User: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    Cleaner: { type: mongoose.Schema.Types.ObjectId, ref: "cleaner" },
    CartData: [
      // cartData (store all items from the cart)
      {
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Services" },
        addOns: { type: mongoose.Schema.Types.ObjectId, ref: "AddOns" },
        TimeSlot: {
          start: { type: Date },
          end: { type: Date },
        },
        Duration: { type: Number },
        TotalPrice: { type: Number },
        UserAddress: { type: String },
        Location: {
          type: {
            type: String,
            enum: ["Point"],
          },
          coordinates: {
            type: [Number], // [longitude, latitude]
            validate: {
              validator: function (value) {
                return value.length === 2; // Ensure [longitude, latitude]
              },
              message:
                "Coordinates must contain exactly two numbers (longitude, latitude).",
            },
          },
        },
      },
    ],
    BookingStatus: {
      type: String,
      enum: ["Pending", "Confirm", "Cancel", "Started", "Completed"],
      default: "Pending",
    },
    OTP: {
      start: { type: String, default: "" },
      end: { type: String, default: "" },
    },
    TotalDuration: { type: Number },
    startBooking: { type: Date },
    endBooking: { type: Date },
    PaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    adminCommission: Number,
  },

  {
    timestamps: true,
  }
);

export const BookingService = mongoose.model("Booking", bookingSchema);
