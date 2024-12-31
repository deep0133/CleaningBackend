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
  message: {
    type: String,
    // required: true, // A message should always be provided
  },
  isRead: {
    type: Boolean,
    default: false, // Default to false as notifications are unread initially
  },
  timestamp: {
    type: Date,
    default: Date.now, // Automatically set the current timestamp
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

export const NotificationModel = model("CleanerNotification", notificationSchema);
