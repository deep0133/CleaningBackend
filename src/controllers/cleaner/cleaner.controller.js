import AccountDetail from "../../models/accountDetail/accountDetail.model.js";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
import { NotificationModel } from "../../models/Notification/notificationSchema.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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
  const cleaner = await NotificationModel.find({
    cleanerId: req.user._id,
  });

  if (!cleaner) {
    return res
      .status(200)
      .json({ success: true, message: "No Notification Found" });
  }
  res.status(200).json({
    success: true,
    data: cleaner,
  });
});

export {
  getAllCleaners,
  getProfile,
  addOrUpdateAccountDetails,
  getCleanerNotification,
};
