import mongoose from "mongoose";
import Stripe from "stripe";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
import { BookingService } from "../../models/Client/booking.model.js";
import { Cart } from "../../models/Client/cart.model.js";
import { PaymentModel } from "../../models/Client/paymentModel.js";
import { ClientNotificationModel } from "../../models/Notification/clientNotification.model.js";
import adminWallet from "../../models/adminWallet/adminWallet.model.js";
import { sendNotificationToClient } from "../../socket/sendNotification.js";
import { convertISTtoUTC } from "../../utils/TimeConversion/timeConversion.js";
import { ApiError } from "../../utils/apiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import validateTimeSlot from "../../utils/validateTimeSlot.js";

import { money, add, toCents, toNum } from "../../utils/moneyConversion.js";

const stripeSecKey = process.env.STRIPE_SERCRET_KEY;
const stripe = new Stripe(stripeSecKey);

export const createBooking = asyncHandler(async (req, res) => {
  const { cartId } = req.body;

  const cart = await Cart.findById(cartId);

  if (cart === null || cart.cart.length === 0) {
    return res.status(404).json({ success: false, message: "Cart not found" });
  }

  if (cart.cart.length !== 1) {
    return res
      .status(400)
      .json({ success: false, message: "Cart should have only one item" });
  }

  // validate user
  if (cart.User.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      success: false,
      message: "You are not authorized to create this booking",
    });
  }

  const existingBooking = await BookingService.findOne({
    User: req.user._id,
    "CartData.categoryId": cart.cart[0].categoryId,
    "CartData.TimeSlot.start": cart.cart[0].TimeSlot.start,
    "CartData.TimeSlot.end": cart.cart[0].TimeSlot.end,
  }).populate("PaymentId");

  if (existingBooking && existingBooking.PaymentId.PaymentStatus) {
    return res
      .status(400)
      .json({ message: "You already have a booking with the same cart data." });
  }

  // calculate total price of cart items
  const totalCartPrice = cart.cart[0].TotalPrice;
  // calculate total duration of cart items
  const totalCartDuration = cart.cart[0].Duration;

  // Begin transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  let adminWalletData = (await adminWallet.findOne({})) || {};

  if (!adminWalletData) {
    adminWalletData.commission = 10;
  }

  try {
    // Step 5: Create the booking document
    const booking = new BookingService({
      User: req.user._id, // User ID from JWT
      CartData: cart.cart,
      TotalDuration: totalCartDuration,
      adminCommission: adminWalletData.commission,
    });

    // Createig Order
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCartPrice * 100,
      currency: "USD",
      metadata: {
        bookingModelId: booking._id.toString(),
      },
    });

    // Step 6: Create a payment document
    const payment = new PaymentModel({
      bookingId: booking._id,
      PaymentValue: totalCartPrice,
      PaymentStatus: "created", // Initial status
      stripeOrderId: paymentIntent.id,
      stripeClientSecerat: paymentIntent.client_secret,
    });

    // Save payment to the database within the same transaction
    await payment.save({ session });

    // Step 7: add payemnt id in booking model
    booking.PaymentId = payment._id;

    // Save booking to the database within a transaction
    await booking.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    console.log(
      "-----response : client_secret-----:",
      paymentIntent.client_secret
    );
    res.status(201).json({
      success: true,
      booking,
      clientSecret: paymentIntent.client_secret,
      bookingId: booking._id,
      orderId: paymentIntent.id,
    });

    // Stipe END here
  } catch (error) {
    // Abort the transaction in case of failure
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create booking",
    });
  }
});

// notification to the cleaner after cleaner accept the booking is pending
export const acceptBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Step 1: Start a session for atomic transaction
  const session = await BookingService.startSession();
  session.startTransaction();

  try {
    // Step 2: Find the booking within the transaction
    const booking = await BookingService.findById(id).session(session);
    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Step 3: Check if the booking has already been accepted
    if (booking.Cleaner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "Booking already accepted by another cleaner",
      });
    }

    // Step 4: Ensure cleaner is available
    const cleaner = await Cleaner.findOne({
      user: req.user._id,
    })
      .populate({
        path: "bookings",
        select: "CartData.TimeSlot",
      })
      .session(session);

    const allCarts = cleaner.bookings.map((booking) => {
      return booking.CartData;
    });

    const timeSlots = allCarts.flatMap((cart) =>
      cart.map((item) => item.TimeSlot)
    );

    if (!cleaner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "You are not authorized to accept this booking",
      });
    }

    // Step 5: Validate booking status (e.g., ensure it's not expired)
    const now = new Date();
    if (booking.CartData[0].TimeSlot.start < now) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Cannot accept an expired booking" });
    }

    // Step 6: Check bookings timeslots with current booking
    const cleanerBookings = cleaner.bookings;

    const validateTimeSlotDuration = validateTimeSlot(
      cleanerBookings,
      booking.CartData[0].TimeSlot
    );

    if (!validateTimeSlotDuration) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Time slot is not available",
      });
    }

    // Step 7: Assign the booking to the cleaner
    booking.Cleaner = req.user._id;
    booking.BookingStatus = "Confirm"; // Accepted
    await booking.save({ session });

    const notificationData = {
      bookingId: id,
      message: "your booking is accepted",
      clientId: booking.User,
      cleanerId: booking.Cleaner,
    };

    sendNotificationToClient(notificationData);

    const clientNotifications = await ClientNotificationModel.create(
      notificationData
    );

    cleaner.totalBookings += 1;
    cleaner.bookings.push(booking._id);

    // Update cleaner's status
    await cleaner.save({ session });

    // Step 8: Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Booking accepted",
      booking,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: "Failed to accept booking. Please try again.",
    });
  }
});

export const startService = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { otp } = req.body;

  const booking = await BookingService.findById(bookingId);

  if (!booking || booking.OTP.start !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  const cleaner = await Cleaner.findOne({ user: booking.Cleaner });

  if (!cleaner) {
    throw new ApiError(401, "No cleaner found");
  }
  const now = new Date();
  const startTime = new Date(booking.CartData[0].TimeSlot.start).getTime();
  const utcStartTime = convertISTtoUTC(startTime);

  if (now.getTime() - new Date(utcStartTime).getTime() > 30 * 60 * 100) {
    return res.status(400).json({
      success: false,
      message: "Booking time is not valid , more than 30min passed",
    });
  }

  if (!cleaner.availability) {
    throw new ApiError(401, "Cleaner is NOT AVAILABLE");
  }

  // Update cleaner's availability and current booking
  cleaner.availability = false;
  cleaner.currentBooking = bookingId;

  cleaner.bookings.pull(bookingId);

  // Update booking status and start time
  booking.BookingStatus = "Started";
  booking.startBooking = new Date(); // Start the timer

  await cleaner.save();
  await booking.save();

  res.status(200).json({ success: true, message: "Service started" });
});

export const endService = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { otp } = req.body;

  console.log("-------Step 1----------: Booking Service-------");
  const booking = await BookingService.findById(bookingId).populate(
    "PaymentId"
  );

  const cleaner = await Cleaner.findOne({ user: booking.Cleaner });
  console.log("-------Step 2---------: Cleaner----------------:", cleaner);

  if (cleaner.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      success: false,
      message: "You are not authorized to end this booking",
    });
  }

  console.log("----------Step - 3---------------");
  if (!booking || booking.OTP.end !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  booking.BookingStatus = "Completed";
  booking.endBooking = new Date();

  const walletAdmin = await adminWallet.findOne();

  console.log("----------Step 4----------: adminWallet------:", walletAdmin);
  const adminCommission = adminWallet?.commission ?? 20;

  // Convert payment amount to a `money` object (stored in cents)
  const paidAmountByUser = money(
    booking.PaymentId.PaymentValue,
    toCents(booking.PaymentId.PaymentValue)
  );

  console.log(
    "----------step - 5 --------: paidAmountByUser----:",
    paidAmountByUser
  );
  // Calculate admin earnings (commission in cents)
  const adminEarnings = money(
    null,
    Math.round((adminCommission * paidAmountByUser.value) / 100)
  );

  console.log(
    "----------step - 6 --------: paidAmountByUser----:",
    adminEarnings
  );
  // // Calculate cleaner's amount in cents
  const cleanerAmountCal = money(
    null,
    paidAmountByUser.value - adminEarnings.value
  );

  console.log(
    "----------step - 7 --------: paidAmountByUser----:",
    cleanerAmountCal
  );
  // Convert back to dollars/rupees safely
  const finalCleanerAmount = toNum(cleanerAmountCal.value);

  console.log(
    "----------step - 8 --------: finalCleanerAmount----:",
    finalCleanerAmount
  );

  console.log("----Step - 8.1------ ownMoney ------:", walletAdmin?.ownMoney);
  // Update walletAdmin's ownMoney properly
  walletAdmin.ownMoney = add(
    money(adminWallet.ownMoney, toCents(adminWallet.ownMoney)),
    adminEarnings
  ).number;

  console.log(
    "----------step - 9 --------: finalCleanerAmount----:",
    finalCleanerAmount
  );
  // udpate cleaner
  cleaner.availability = true;
  cleaner.currentBooking = null;
  cleaner.earnings += finalCleanerAmount;
  // cleaner.earnings = add(money(cleaner.earnings), cleanerAmountCal).number;

  await walletAdmin.save();

  await booking.save();
  await cleaner.save();

  res.status(200).json({
    success: true,
    data: {
      adminEarnings,
      cleanin,
    },
    booking,
  });
});

//----------------------------------------------------------------------

// Get All Bookings:
export const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingService.find()
    .populate({
      path: "User",
      select: "-password -__v -accessToken -refreshToken",
    })
    .populate({
      path: "Cleaner",
      select: "-bookings -__v -user",
    })
    .populate({
      path: "PaymentId",
      select: "-__v -stripeClientSecerat -bookingId",
    })
    .select("-OTP -__v");

  res.status(200).json({ success: true, count: bookings?.length, bookings });
});

// Get Users Booking : All Bookings
export const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingService.find({ User: req.user._id })
    .populate("Cleaner")
    .populate({
      path: "PaymentId",
      select: "-__v -stripeClientSecerat -bookingId",
    })
    .populate({
      path: "CartData.categoryId", // Populate categoryId inside CartData array
      select: "name", // Example: exclude unnecessary fields from Services
    })
    .select("-OTP -__v");

  res.status(200).json({ success: true, count: bookings?.length, bookings });
});

// Get Cleaner Bookings
export const getCleanerBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingService.find({
    Cleaner: req.user._id,
  })
    .populate({ path: "User", select: "-password -__v" })
    .populate({
      path: "PaymentId",
      select: "-__v -stripeClientSecerat -bookingId",
    })
    .select("-OTP -__v");

  res.status(200).json({ success: true, bookings });
});

// Get Booking By ID
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await BookingService.findById(req.params.id)
    .populate({ path: "User", select: "-password -__v" })
    .populate("Cleaner")
    .populate({
      path: "PaymentId",
      select: "-__v -stripeClientSecerat -bookingId",
    })
    .select("-OTP -__v");

  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  res.status(200).json({ success: true, booking });
});

// Get All Upcomming Bookings :
export const getAllUpcomingBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingService.find({
    CartData: {
      $elemMatch: { "TimeSlot.start": { $gt: new Date() } },
    },
  })
    .populate({ path: "User", select: "-password -__v" }) // Use correct case
    .populate("Cleaner"); // Use correct case

  res.status(200).json({ success: true, bookings });
});

// Get All Past Bookings :
export const getAllPastBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingService.find({
    CartData: {
      $elemMatch: { "TimeSlot.end": { $lt: new Date() } },
    },
  })
    .populate({ path: "User", select: "-password -__v" })
    .populate("Cleaner");

  res.status(200).json({ success: true, bookings });
});

// Get Current Bookings :
export const getCurrentBookings = asyncHandler(async (req, res) => {
  const currentTime = new Date();
  const bookings = await BookingService.find({
    cartData: {
      $elemMatch: {
        "TimeSlot.start": { $lte: currentTime },
        "TimeSlot.end": { $gte: currentTime },
      },
    },
  })
    .populate({ path: "User", select: "-password -__v" })
    .populate("Cleaner");

  res.status(200).json({ success: true, bookings });
});

export const cancelBookingByAdmin = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const session = await mongoose.startSession(); // Start a session
  session.startTransaction();

  try {
    // Find the booking
    const booking = await BookingService.findById(bookingId).session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.Cleaner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Booking can't cancel due to accepted by cleaner",
      });
    }

    const paymentModel = await PaymentModel.findById(booking.PaymentId).session(
      session
    );

    // Refund the payment on Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentModel.stripeOrderId,
      metadata: {
        reason: "Customer requested a refund",
        bookingModelId: booking._id.toString(),
      },
    });

    // Update the booking status
    booking.BookingStatus = "Cancel";
    paymentModel.refundId = refund.id;

    await await paymentModel.save({ session });
    await await booking.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Booking canceled and payment refunded",
      refund,
    });
  } catch (error) {
    // Rollback the transaction if an error occurs
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking and process refund. Try again later.",
    });
  }
});

// Get Request by User for start OTP
export const sendStartOtp = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await BookingService.findOne({
    User: req.user._id,
    _id: bookingId,
  });

  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  const start = new Date(booking.CartData[0].TimeSlot.start); // Start time in milliseconds

  const now = new Date();

  const startTime = convertISTtoUTC(start);

  if (
    new Date(now).getTime() >= new Date(startTime).getTime() ||
    new Date(now).getTime() >= new Date(startTime).getTime() - 15 * 60 * 1000
  ) {
    // Allow access
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    booking.OTP.start = otp;

    await booking.save();

    res.status(200).json({ success: true, message: "OTP sent", otp });
  } else {
    // Deny access
    res.json({
      success: false,
      message: "User has to wait for the booking to start.",
    });
  }
});

// Get Request by User for end OTP
export const sendEndOtp = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await BookingService.findById(bookingId);

  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  const startOtpGenerated = booking.OTP.start;

  if (!startOtpGenerated) {
    return res
      .status(400)
      .json({ success: false, message: "Start OTP not generated yet" });
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  booking.OTP.end = otp;

  await booking.save();

  res.status(200).json({ success: true, message: "OTP sent", otp });
});
