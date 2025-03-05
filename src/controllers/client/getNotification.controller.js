import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ClientNotificationModel } from "../../models/Notification/clientNotification.model.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const clientNotifications = await ClientNotificationModel.findOne({
    clientId: req.user._id,
  });
  if (!clientNotifications) {
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { clientNotifications },
          "u have no notifications",
          true
        )
      );
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { clientNotifications },
        "client Notifications",
        true
      )
    );
});
