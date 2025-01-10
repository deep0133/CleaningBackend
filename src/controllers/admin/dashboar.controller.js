import { BookingService } from "../../models/Client/booking.model.js";
import { User } from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getGeneralInfo = asyncHandler(async (req, res) => {
  const bookingCount = await BookingService.countDocuments({});
  const cleanerCount = await User.countDocuments({ role: "cleaner" });
  const userCount = await User.countDocuments({ role: "client" });
  res.status(200).json({
    success: true,
    message: "General info",
    data: {
      bookingCount,
      cleanerCount,
      userCount,
    },
  });
});

export { getGeneralInfo };
