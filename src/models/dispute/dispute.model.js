import { Schema, model } from "mongoose";

const disputeSchema = new Schema(
  {
    senderRole: {
      type: String,
      enum: ["client", "cleaner"],
      required: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      default: "pending",
    },
    response: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const disputeModel = model("Dispute", disputeSchema);

export default disputeModel;
