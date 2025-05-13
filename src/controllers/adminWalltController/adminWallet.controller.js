import adminWallet from "../../models/adminWallet/adminWallet.model.js";
import { BookingService } from "../../models/Client/booking.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
// Initialize admin wallet if it doesn't exist
const initializeWallet = async () => {
  try {
    let AdminWallet = await adminWallet.findOne();
    if (!AdminWallet) {
      AdminWallet = await adminWallet.create({
        total: 0,
        paymentHistory: [], // Fixed typo in field name
        commsion: 20,
      });
    }
    return AdminWallet;
  } catch (error) {
    throw new Error("Failed to initialize admin wallet");
  }
};

// Update wallet on successful booking
const updateWalletOnBooking = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and amount are required",
      });
    }

    // Verify booking exists
    const booking = await BookingService.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Get or initialize admin wallet
    let AdminWallet = await adminWallet.findOne();
    if (!AdminWallet) {
      AdminWallet = await initializeWallet(); // Fixed function call
    }

    // Update wallet total and payment history
    AdminWallet.total += Number(amount);
    AdminWallet.paymentHistory.push(bookingId); // Fixed field name

    await AdminWallet.save();

    return res.status(200).json({
      success: true,
      message: "Admin wallet updated successfully",
      data: AdminWallet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update admin wallet",
      error: error.message,
    });
  }
};

// Handle refund on order cancellation
const handleOrderCancellation = async (req, res) => {
  try {
    const { bookingId, refundAmount } = req.body;

    if (!bookingId || !refundAmount) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and refund amount are required",
      });
    }

    // Verify booking exists
    const booking = await BookingService.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Get admin wallet
    let AdminWallet = await adminWallet.findOne();
    if (!AdminWallet) {
      return res.status(404).json({
        success: false,
        message: "Admin wallet not found",
      });
    }

    // Ensure sufficient balance for refund
    if (AdminWallet.total < refundAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance for refund",
      });
    }

    // Process refund
    AdminWallet.total -= Number(refundAmount);

    // Remove booking from payment history if exists
    const bookingIndex = AdminWallet.paymentHistory.indexOf(bookingId); // Fixed field name
    if (bookingIndex > -1) {
      AdminWallet.paymentHistory.splice(bookingIndex, 1); // Fixed field name
    }

    await AdminWallet.save();

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: AdminWallet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process refund",
      error: error.message,
    });
  }
};

// Get admin wallet details
const getWalletDetails = async (req, res) => {
  try {
    const AdminWallet = await adminWallet.findOne({}).populate({
      path: "paymentHistory", // Field to populate
      select: "PaymentValue PaymentStatus", // Fields you want from the Payment schema
      populate: {
        path: "bookingId", // Field to populate
        select: "User Cleaner -_id", // Fields you want from the Booking schema
      },
    });

    if (!AdminWallet) {
      return res.status(404).json({
        success: false,
        message: "Admin wallet not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: AdminWallet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet details",
      error: error.message,
    });
  }
};

const setCommission = asyncHandler(async (req, res) => {
  const { commission } = req.body;

  if (!commission) {
    return res.status(400).json({
      success: false,
      message: "Commission is required",
    });
  }

  if (isNaN(commission) && commission >= 0 && commission <= 100) {
    return res.status(400).json({
      success: false,
      message: "Commission must be a number and range should be [ 0 - 100 ]",
    });
  }

  let AdminWallet = await adminWallet.findOne();
  if (!AdminWallet) {
    AdminWallet = await initializeWallet();
  }

  AdminWallet.commission = commission;

  await AdminWallet.save();

  return res.status(200).json({
    success: true,
    message: "Commission updated successfully",
    data: AdminWallet,
  });
});

export {
  initializeWallet,
  getWalletDetails,
  setCommission,
  updateWalletOnBooking,
  handleOrderCancellation,
};
