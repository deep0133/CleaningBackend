import mongoose from "mongoose";

const adminWalletSchema = new mongoose.Schema({
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
});

const adminWallet = mongoose.model("adminWallet", adminWalletSchema);
export default adminWallet;
