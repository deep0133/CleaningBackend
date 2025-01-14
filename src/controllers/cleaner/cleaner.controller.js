import AccountDetail from "../../models/accountDetail/accountDetail.model.js";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
import { NotificationModel } from "../../models/Notification/notificationSchema.js";
import ReviewModel from "../../models/Review/review.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { BookingService } from "../../models/Client/booking.model.js";
import { ApiError } from "../../utils/apiError.js";

// get profile:
const getProfile = asyncHandler(async (req, res) => {
  const userDetail = req.cleaner_data_in_user;

  const cleanerDetail = await Cleaner.findOne({ user: req.user._id })
    .populate("accountId")
    .select("-user -createdAt -updatedAt -__v -role");

  res.status(200).json({
    success: true,
    data: { ...cleanerDetail.toObject(), ...userDetail.toObject() },
  });
});

const getAllCleaners = asyncHandler(async (req, res) => {
  const cleaners = await Cleaner.find().populate("accountId");

  res.status(200).json({
    success: true,
    data: cleaners,
  });
});

// ------update account details for a service provider
const addOrUpdateAccountDetails = asyncHandler(async (req, res) => {
  const { accountNumber, accountName, bankName, accountType } = req.body;

  if (!accountNumber || !accountName || !bankName || !accountType) {
    return res.status(400).json({
      message: "Please provide account details",
    });
  }

  const cleaner = await Cleaner.findOne({
    user: req.user._id,
  });

  if (!cleaner) {
    return res.status(404).json({ message: "Cleaner not found" });
  }

  const accountDetail = new AccountDetail({
    accountNumber,
    accountName,
    bankName,
    accountType,
  });

  await accountDetail.save();

  cleaner.accountId = accountDetail._id;
  await cleaner.save();

  res.status(200).json({
    message: "Account details saved successfully",
    data: accountDetail,
  });
});

const getCleanerNotification = asyncHandler(async (req, res) => {
  console.log(
    "------------------------------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------------------------------"
  );
  console.log(
    "------------------------------------------------------------------------------------------"
  );
   console.log(req.user._id);
  const notification = await NotificationModel.find({cleanerId:req.user_id});
  console.log('----------notification---------------',notification);

  const cleaner = await NotificationModel.find({
    cleanerId: req.user._id,
  }).populate({
    path: "bookingId",
    select: "BookingStatus",
  });

  console.log(
    "-----------------------total notificaitons ----------------",
    cleaner?.length
  );
   console.log("-----------------cleaner------------",cleaner)
  if (!cleaner) {
    return res
      .status(200)
      .json({ success: true, message: "No Notification Found" });
  }

  const newNoti = [];
  const currentTime = Date.now();
  for (let notification of cleaner) {
    if (notification.isExpire) {
      continue;
    }

    // const booking = notification.bookingId;
    const booking  = notification;
    console.log("==========booking--==========",booking);
    console.log("--------bookingStatus----------", booking.bookingId?.BookingStatus);

    if (notification.timestamp.start < currentTime) {
      continue;
    }

    // Check the BookingStatus of each notification's bookingIdvz
    if (booking.bookingId?.BookingStatus === "Confirm") {
      // throw new ApiError(401, "Booking is already accepted");
      continue;
    }

    newNoti.push(notification);
    console.log("---------bookings----------");
  }

  console.log("-------------newNoti----------------:", newNoti?.length);

  res.status(200).json({
    success: true,
    data: newNoti,
  });
});

const addReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  const booking = await BookingService.findById(bookingId);
  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  if (booking?.User?.toString() !== req.user._id.toString()) {
    return res.status(404).json({
      success: false,
      message: "You are not allowed to review this booking",
    });
  }

  const newReview = new ReviewModel({ bookingId, rating, comment });
  await newReview.save();

  const cleanerId = await booking.Cleaner;

  if (cleanerId) {
  }

  const cleaner = await Cleaner.findOne({ user: cleanerId });

  if (!cleaner) {
    return res.status(404).json({
      success: false,
      message: "Cleaner not found",
    });
  }

  cleaner.review.push(newReview._id);

  await cleaner.save();

  return res
    .status(200)
    .json({ success: true, message: "Review added successfully!", newReview });
});

const getAllReview = asyncHandler(async (req, res) => {
  const reviews = await ReviewModel.find({})
    .populate({
      path: "bookingId",
      select: "User Cleaner",
      populate: {
        path: "User",
        select: "name email phoneNumber role address",
      },
    })
    .sort({ created: -1 });
  res.status(200).json({
    success: true,
    count: reviews?.length,
    data: reviews,
  });
});

const getSingleReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await ReviewModel.findById(id).populate({
    path: "bookingId",
    select: "User Cleaner",
    populate: {
      path: "User",
      select: "name email phoneNumber role address",
    },
  });
  res.status(200).json({
    success: true,
    data: review,
  });
});

export {
  addOrUpdateAccountDetails,
  getAllCleaners,
  getCleanerNotification,
  getProfile,
  addReview,
  getAllReview,
  getSingleReview,
};
