import mongoose from "mongoose";
const { Schema } = mongoose;

const contactSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference the User model
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      match: [true, "Email  is required"],
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      match: [true, "Phone number is required"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Contact = mongoose.model("Contact", contactSchema);
