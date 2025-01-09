import disputeModel from "../../models/dispute/dispute.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAllDisputes = asyncHandler(async (req, res) => {
  const disputes = await disputeModel.find({}).sort({ createdAt: -1 });
  const role = req.user.role;

  if (role === "cleaner") res.status(200).json(disputes);
});

// get user disputes:
const getUserDisputes = asyncHandler(async (req, res) => {
  const role = req.user.role;
  let disputes = [];
  if (role === "client") {
    disputes = await disputeModel
      .find({ sender: req.user._id })
      .populate({
        path: "bookingId",
        populate: {
          path: "Cleaner",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });
    res.status(200).json(disputes);
  }
});

// post dispute:
const createDispute = asyncHandler(async (req, res) => {
  const { bookingId, reason } = req.body;

  if (!bookingId || !reason)
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the fields" });

  const dispute = await disputeModel.create({
    bookingId,
    reason,
    sender: req.user.role,
  });
  res.status(201).json(dispute);
});
