import mongoose, { mongo } from "mongoose";

const requestHistorySchema = mongoose.Schema({
  User: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requests: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClientRequest",
  },
});

requestHistorySchema.index({ User: 1 });

export const RequestHistory = mongoose.model(
  "RequestHistory",
  requestHistorySchema
);
