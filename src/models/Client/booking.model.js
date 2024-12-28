import mongoose from "mongoose";

const bookingSchema = mongoose.Schema(
  {
    User: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    Cleaner: { type: mongoose.Schema.Types.ObjectId, ref: "Cleaner" },

    CartData: [
      // cartData (store all items from the cart)
      {
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Services" },
        addOns: [{ type: mongoose.Schema.Types.ObjectId, ref: "AddOns" }],
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
      type: Boolean,
      enum: ["Pending", "Confirm", "Cancel"],
      default: "Pending",
    }, // when cleaner Accept : true
    OTP: { start: { type: String }, end: { type: String } },
    TotalDuration: { type: Number },
    PaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

export const BookingService = mongoose.model("Booking", bookingSchema);
