import { model, Schema } from "mongoose";
const notificationSchema = new Schema({
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
  name: String,
  message: {
    type: String,
    // required: true, // A message should always be provided
  },
  isRead: {
    type: Boolean,
    default: false, // Default to false as notifications are unread initially
  },
  address: String,
  timestamp: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
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

export const NotificationModel = model(
  "CleanerNotification",
  notificationSchema
);
