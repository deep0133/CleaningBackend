import { model, Schema } from "mongoose";
const notificationSchema = new Schema({
  clientId:{
      type:Schema.Types.ObjectId,
      ref:"User"
  },
  cleanerId: {
    type: Schema.Types.ObjectId,
    ref: "Cleaner", // Ensure the model name matches your actual Cleaner model
    // required: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: "Booking", // Ensure the model name matches your Booking model
    // required: true,
  },
  message: {
    type: String,
    // required: true, // A message should always be provided
  },
  isExpire: {
    type: Boolean,
    default: false, // Default to false, updated when checked
  },
});

// Function to check if the notification has expired based on the booking's TimeSlot
notificationSchema.methods.isNotificationExpired = function () {
  return (
    this.timestamp.getTime() + this.bookingId.TimeSlot.start.getTime() <
    Date.now()
  );
};

export const ClientNotificationModel = model(
  "clientNotifications",
  notificationSchema
);
