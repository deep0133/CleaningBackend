import mongoose from "mongoose";

const adminWalletSchema = new mongoose.Schema(
  {
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        required: true,
      },
    ],
    commission: {
      type: Number, // % age of commision
      required: true,
      default: 0,
      min: [0, "commission must be at least 0"], // Minimum value validator
      max: [100, "commission cannot exceed 100"], // Maximum value validator
    },
    ownMoney: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const adminWallet = mongoose.model("adminWallet", adminWalletSchema);
export default adminWallet;
