import mongoose from "mongoose";

const cartSchema = mongoose.Schema(
  {
    User: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cart: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Services",
          required: true,
        },
        addOns: [{ type: mongoose.Schema.Types.ObjectId, ref: "AddOns" }],
        TimeSlot: {
          start: { type: Date, required: true },
          end: { type: Date, required: true },
        },
        Duration: { type: Number },
        TotalPrice: { type: Number, required: true },
        UserAddress: { type: String, required: true },
        Location: {
          type: {
            type: String,
            enum: ["Point"],
            required: true,
          },
          coordinates: {
            type: [Number],
            required: true,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Cart = mongoose.model("Cart", cartSchema);
