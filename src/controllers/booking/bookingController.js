import mongoose from "mongoose";
import Stripe from "stripe";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
import { BookingService } from "../../models/Client/booking.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Cart } from "../../models/Client/cart.model.js";
import { PaymentModel } from "../../models/Client/paymentModel.js";
import sendNotification from "../../socket/sendNotification.js";
// import { NotificationModel } from "../../models/Notification/notificationSchema.js";

const stripe = new Stripe(process.env.STRIPE_SERCRET_KEY);

export const createBooking = asyncHandler(async (req, res) => {
  const { cartId } = req.body;

  const cart = await Cart.findById(cartId);

  if (cart === null) {
    return res.status(404).json({ success: false, message: "Cart not found" });
  }

  if (!cart && cart?.cart.length === 0) {
    return res.status(404).json({ success: false, message: "Cart is empty" });
  }

  // validate user
  if (cart.User.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      success: false,
      message: "You are not authorized to create this booking",
    });
  }

  // calculate total price of cart items
  const totalCartPrice = cart.cart.reduce(
    (sum, item) => sum + item.TotalPrice,
    0
  );
  // calculate total duration of cart items
  const totalCartDuration = cart.cart.reduce(
    (sum, item) => sum + item.Duration,
    0
  );

  // Begin transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 5: Create the booking document
    const booking = new BookingService({
      User: req.user._id, // User ID from JWT
      CartData: cart.cart,
      BookingStatus: false, // Pending until a cleaner accepts
      OTP: {
        start: Math.floor(1000 + Math.random() * 9000).toString(), // Random 4-digit OTP
        end: Math.floor(1000 + Math.random() * 9000).toString(),
      },
      TotalDuration: totalCartDuration,
    });

    // Createig Order
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCartPrice * 100,
      currency: "INR",
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

    // Return response with the Razorpay order details if available
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

export const getNearbyCleaners = asyncHandler(async (req, res) => {
  // how to send location in what format should i send location
  const { location, category } = req.body;

  if (!location || !location.longitude || !location.latitude) {
    throw new ApiError(400, "location is required");
  }

  const longitude = parseFloat(location.longitude);
  const latitude = parseFloat(location.latitude);

  const cleaners = await Cleaner.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: 10000, // 10 km
      },
    },
    category: { $in: [category] },
    availability: true,
  });

  if (cleaners.length === 0) {
    res
      .status(200)
      .json(
        new ApiResponse(200, {}, "no cleaner avaliable in this area ", true)
      );
  }

  cleaners.forEach((cleaner) => {
    if (cleaner.socketId) {
      // Ensure cleaner is connected via socket
      io.to(cleaner.socketId).emit("new_job_notification", {
        title: "New Cleaning Job Available!",
        body: `A new ${category} job is available near your location.`,
        jobDetails: {
          userSocketId: socketId, // Pass user socket ID if needed
          location: { longitude, latitude },
          category,
        },
      });
    } else {
      console.log(`Cleaner ${cleaner._id} is not connected via socket.`);
    }
  });

  res.status(200).json(new ApiResponse(200, cleaners, "cleaners found", true));
});

export const acceptBooking = asyncHandler(async (req, res) => {
  const { id } = req.params; // Booking ID from URL

  // Step 1: Find the booking
  const booking = await BookingService.findById(id);
  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  // Step 2: Check if the booking has already been accepted
  if (booking.Cleaner) {
    return res.status(409).json({
      success: false,
      message: "Booking already accepted by another cleaner",
    });
  }

  // Step 3: Ensure cleaner is available
  const cleaner = await Cleaner.findOne({
    user: req.user._id, // Cleaner ID from JWT
    availability: true,
  });

  if (!cleaner) {
    return res.status(400).json({
      success: false,
      message: "Cleaner not available or already assigned to another booking",
    });
  }

  // Step 4: Check if the cleaner has an active booking
  if (cleaner.currentBooking) {
    return res.status(400).json({
      success: false,
      message: "Cleaner is already working on another booking",
    });
  }

  // Step 5: Validate booking status (e.g., ensure it's not expired)
  const now = new Date();
  if (booking.TimeSlot.start < now) {
    return res
      .status(400)
      .json({ success: false, message: "Cannot accept an expired booking" });
  }

  // Step 6: Atomic Update - Assign the booking to the cleaner
  const session = await BookingService.startSession();
  session.startTransaction();

  try {
    // Assign the cleaner to the booking
    booking.Cleaner = cleaner._id;
    booking.BookingStatus = true; // Accepted
    await booking.save({ session });

    // Update cleaner's status
    cleaner.availability = false; // Mark cleaner as unavailable
    cleaner.currentBooking = booking._id; // Set current booking
    await cleaner.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Step 7: Respond with success
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
  const { id } = req.params;
  const { otp } = req.body;

  const booking = await BookingService.findById(id);

  if (!booking || booking.OTP.start !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  booking.TimeSlot.start = new Date(); // Start the timer
  await booking.save();

  res.status(200).json({ success: true, message: "Service started" });
});

export const endService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  const booking = await BookingService.findById(id).populate("Cleaner");

  if (!booking || booking.OTP.end !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  const endTime = new Date();
  const duration = Math.ceil((endTime - booking.TimeSlot.start) / 60000); // Minutes

  booking.TimeSlot.end = endTime;
  booking.Duration = duration;

  // Calculate total price (e.g., $10/hour)
  const baseRate = 10; // Per hour
  const extraCharge = duration > 120 ? ((duration - 120) / 60) * baseRate : 0;
  booking.TotalPrice = booking.PaymentValue + extraCharge;

  booking.save();

  res.status(200).json({ success: true, booking });
});

// Get Users Booking : All Bookings
export const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingService.find({ User: req.user._id })
    .populate("Cleaner")
    .populate({
      path: "PaymentId",
      select: "-__v -stripeClientSecerat -bookingId",
    })
    .select("-OTP -__v");

  res.status(200).json({ success: true, bookings });
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
    "TimeSlot.start": { $gt: new Date() },
  })
    .populate({ path: "User", select: "-password -__v" })
    .populate("Cleaner");

  res.status(200).json({ success: true, bookings });
});

// Get All Past Bookings :
export const getAllPastBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingService.find({
    "TimeSlot.end": { $lt: new Date() },
  })
    .populate({ path: "User", select: "-password -__v" })
    .populate("Cleaner");

  res.status(200).json({ success: true, bookings });
});

// Get Current Bookings :
export const getCurrentBookings = asyncHandler(async (req, res) => {
  const bookings = await BookingService.find({
    "TimeSlot.start": { $lte: new Date() },
    "TimeSlot.end": { $gte: new Date() },
  })
    .populate({ path: "User", select: "-password -__v" })
    .populate("Cleaner");

  res.status(200).json({ success: true, bookings });
});

// Cancel Booking by Admin
export const cancelBookingByAdmin = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  // Find the booking
  const booking = await BookingService.findById(bookingId).populate(
    "PaymentId"
  );

  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  // Refund the payment on Stripe
  try {
    const refund = await stripe.refunds.create({
      payment_intent: booking.PaymentId.stripeOrderId,
    });

    // Update the booking status
    booking.BookingStatus = "Cancel";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking canceled and payment refunded",
      refund,
    });
  } catch (error) {
    console.error("Stripe refund error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process refund. Try again later.",
    });
  }
});
