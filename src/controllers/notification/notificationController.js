import { NotificationModel } from "../../models/Notification/notificationSchema.js";

export const readNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await NotificationModel.findById(notificationId);

  if (!notification) {
    return res
      .status(404)
      .json({ success: false, message: "Notification not found" });
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ success: true, notification });
});
