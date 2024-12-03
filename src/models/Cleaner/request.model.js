import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    bookingClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking client is required"],
    },
    serviceMan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceMan", // Ensure the referenced model name matches your actual model
    },
    requestStatus: {
      type: String,
      enum: ["accept", "reject", "pending"],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true, 
    versionKey: false,
  }
);

export const ClientRequest = mongoose.model("ClientRequest", requestSchema);
