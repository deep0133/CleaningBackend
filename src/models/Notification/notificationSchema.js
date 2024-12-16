import { model, Schema } from "mongoose";
const notificationSchema = new Schema({
  cleanerId: {
    type: Schema.Types.ObjectId,
    ref: "cleaner",
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: "Booking",
  },
  message: String, // Details of the notification
  isRead: Boolean, // To track if the cleaner has seen it
  timestamp: Date,
  isExpire: Boolean,
});

// Function to check if the notification has expired based on the booking's TimeSlot
notificationSchema.methods.isNotificationExpired = function () {
  return (
    this.timestamp.getTime() + this.bookingId.TimeSlot.start.getTime() <
    Date.now()
  );
};

const NotificationModel = model("CleanerNotification", notificationSchema);

export default NotificationModel;
