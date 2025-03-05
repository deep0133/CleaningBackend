import disputeModel from "../../models/dispute/dispute.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAllDisputes = asyncHandler(async (req, res) => {
  const disputes = await disputeModel
    .find({})
    .populate({
      path: "bookingId",
      populate: {
        path: "User",
        select: "name email phoneNumber role address",
      },
    })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json({ success: true, count: disputes?.length, data: disputes });
});

// get user disputes:
const getDisputeDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const dispute = await disputeModel
    .findById(id)
    .populate({
      path: "bookingId",
      populate: {
        path: "User",
        select: "name email phoneNumber role address",
      },
      populate: {
        path: "cleanerId",
        select:
          "category rating totalBookings completedBookings earnings accountId",
      },
    })
    .sort({ createdAt: -1 });

  if (!dispute) {
    return res
      .status(404)
      .json({ success: false, message: "Dispute not found" });
  }

  return res.status(200).json({ success: true, data: dispute });
});
// post dispute:
const createDispute = asyncHandler(async (req, res) => {
  const { bookingId, reason } = req.body;

  const role = req.user.role;
  if (!bookingId || !reason)
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the fields" });

  const dispute = await disputeModel.create({
    bookingId,
    reason,
    senderRole: role,
  });
  res.status(201).json(dispute);
});

export { getAllDisputes, getDisputeDetails, createDispute };
