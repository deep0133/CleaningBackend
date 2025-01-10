import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ReviewModel = mongoose.model("Review", reviewSchema);

export default ReviewModel;
