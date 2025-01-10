import mongoose from "mongoose";
import Stripe from "stripe";
import { BookingService } from "../../models/Client/booking.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Cart } from "../../models/Client/cart.model.js";
import { PaymentModel } from "../../models/Client/paymentModel.js";
import validateTimeSlot from "../../utils/validateTimeSlot.js";
import adminWallet from "../../models/adminWallet/adminWallet.model.js";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";

const stripe = new Stripe(process.env.STRIPE_SERCRET_KEY);

export const createBooking = asyncHandler(async (req, res) => {
  const { cartId } = req.body;

  const cart = await Cart.findById(cartId);

  console.log("--------step 1-------check cart,", cart);
  if (cart === null || cart.cart.length === 0) {
    return res.status(404).json({ success: false, message: "Cart not found" });
  }

  if (cart.cart.length !== 1) {
    return res
      .status(400)
      .json({ success: false, message: "Cart should have only one item" });
  }

  console.log("--------step 2-------check cart time slot");
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

  console.log(
    "---------step 3 ---existing booking ---- checking-----------:",
    existingBooking
  );
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
  console.log("---------admin Wallet --------:", adminWalletData);

  if (!adminWalletData) {
    console.log(
      "-------Admin commission not set.--- default set to 10%-------"
    );
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

    console.log("-------------Failed---------:", error.message);

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

// export const acceptBooking = asyncHandler(async (req, res) => {
//   const { id } = req.params; // Booking ID from URL

//   // Step 1: Start a session for atomic transaction
//   const session = await BookingService.startSession();
//   session.startTransaction();

//   const booking = await BookingService.findById(id);
//   if (!booking) {
//     return res
//       .status(404)
//       .json({ success: false, message: "Booking not found" });
//   }

//   console.log("-------Step2----------");
//   // Step 2: Check if the booking has already been accepted
//   if (booking.Cleaner) {
//     return res.status(409).json({
//       success: false,
//       message: "Booking already accepted by another cleaner",
//     });
//   }

//   console.log("-------Step3----------");

//   // Step 3: Ensure cleaner is available
//   const cleaner = await Cleaner.findOne({
//     user: req.user._id,
//   }).populate({
//     path: "bookings",
//     select: "CartData.TimeSlot",
//   });

//   console.log("---------cleaner exits----------");

//   if (!cleaner) {
//     return res.status(400).json({
//       success: false,
//       message: "You are not authorized to accept this booking",
//     });
//   }

//   console.log("---------step 4 cleaner found----------");

//   // Step 5: Validate booking status (e.g., ensure it's not expired)
//   const now = new Date();
//   if (booking.CartData[0].TimeSlot.start < now) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Cannot accept an expired booking" });
//   }
//   console.log("---------step 5 booking found--- with future time slot-------");

//   // Step 6: check bookings timeslots with current booking
//   const cleanerBookings = cleaner.bookings;

//   console.log("---------step 6 cleaner booking found-------", cleanerBookings);

//   const validateTimeSlotDuration = validateTimeSlot(
//     cleanerBookings,
//     booking.CartData[0].TimeSlot
//   );

//   console.log(
//     "---------Time slot check and value is ---------:",
//     validateTimeSlotDuration
//   );

//   if (!validateTimeSlotDuration) {
//     return res.status(400).json({
//       success: false,
//       message: "Time slot is not available",
//     });
//   }

//   console.log("----------step 7 -----------session started");
//   // Step 7: Atomic Update - Assign the booking to the cleaner
//   const session = await BookingService.startSession();
//   session.startTransaction();

//   try {
//     // Assign the cleaner to the booking
//     booking.Cleaner = req.user._id;
//     booking.BookingStatus = "Confirm"; // Accepted
//     await booking.save({ session });

//     console.log(
//       "---------- step 8 ------booking_id adding in cleaner schema----"
//     );
//     cleaner.totalBookings += 1;
//     cleaner.bookings.push(booking._id);

//     // Update cleaner's status
//     await cleaner.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // Step 8: Respond with success
//     res.status(200).json({
//       success: true,
//       message: "Booking accepted",
//       booking,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();

//     res.status(500).json({
//       success: false,
//       message: "Failed to accept booking. Please try again.",
//     });
//   }
// });

export const acceptBooking = asyncHandler(async (req, res) => {
  const { id } = req.params; // Booking ID from URL

  console.log("------Step1-----------id---:", req.user._id);

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

    console.log("-------Step2----------");

    // Step 3: Check if the booking has already been accepted
    if (booking.Cleaner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "Booking already accepted by another cleaner",
      });
    }

    console.log("-------Step3----------");

    // Step 4: Ensure cleaner is available
    const cleaner = await Cleaner.findOne({
      user: req.user._id,
    })
      .populate({
        path: "bookings",
        select: "CartData.TimeSlot",
      })
      .session(session);

    console.log("---------cleaner exits----------");

    if (!cleaner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "You are not authorized to accept this booking",
      });
    }

    console.log("---------step 4 cleaner not found----------");

    // Step 5: Validate booking status (e.g., ensure it's not expired)
    const now = new Date();
    if (booking.CartData[0].TimeSlot.start < now) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Cannot accept an expired booking" });
    }
    console.log(
      "---------step 5 booking found--- with future time slot-------"
    );

    // Step 6: Check bookings timeslots with current booking
    const cleanerBookings = cleaner.bookings;

    console.log(
      "---------step 6 cleaner booking found-------",
      cleanerBookings
    );

    const validateTimeSlotDuration = validateTimeSlot(
      cleanerBookings,
      booking.CartData[0].TimeSlot
    );

    console.log(
      "---------Time slot check and value is ---------:",
      validateTimeSlotDuration
    );

    if (!validateTimeSlotDuration) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Time slot is not available",
      });
    }

    console.log("----------step 7 -----------session started");

    // Step 7: Assign the booking to the cleaner
    booking.Cleaner = req.user._id;
    booking.BookingStatus = "Confirm"; // Accepted
    await booking.save({ session });

    console.log(
      "---------- step 8 ------booking_id adding in cleaner schema----"
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

    console.log(
      "-----------------Error in catch block-------------:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to accept booking. Please try again.",
    });
  }
});

// Testing pending...
export const startService = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { otp } = req.body;

  const booking = await BookingService.findById(bookingId);

  if (!booking || booking.OTP.start !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  const cleaner = await Cleaner.findById(booking.Cleaner);
  // check booking time : difference should be 15 minutues
  const now = new Date();
  if (
    !(
      Math.abs(new Date(booking.CartData[0].TimeSlot.start) - now) >
      15 * 60 * 1000
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Booking time is not valid",
    });
  }

  cleaner.availability = false;
  cleaner.currentBooking = bookingId;

  booking.BookingStatus = "Started";
  booking.bookings.pull(bookingId);
  booking.startBooking = new Date(); // Start the timer

  await booking.save();

  res.status(200).json({ success: true, message: "Service started" });
});

export const endService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  const booking = await BookingService.findById(id).populate("PaymentId");
  const cleaner = await Cleaner.findById(booking.Cleaner);

  if (cleaner.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      success: false,
      message: "You are not authorized to end this booking",
    });
  }

  if (!booking || booking.OTP.end !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  booking.BookingStatus = "Completed";
  booking.endBooking = new Date();

  const adminWallet = await adminWallet.findOne();
  const adminCommission = adminWallet.commission || 20;

  // Calculate total price (e.g., $10/hour)
  const paidAmountByCleaner = booking.PaymentId.PaymentValue;

  // Calculate admin commission (e.g., 20%)
  const cleanerAmountCal =
    ((100 - adminCommission) / 100) * paidAmountByCleaner;
  // booking.TotalPrice = booking.PaymentValue + extraCharge;

  console.log("------------cleaner Ammount--------------:", cleanerAmountCal);

  adminWallet.ownMoney =
    adminWallet.ownMoney + (paidAmountByCleaner - cleanerAmountCal);
  // udpate cleaner
  cleaner.availability = true;
  cleaner.currentBooking = null;
  cleaner.earnings += cleanerAmountCal;

  await adminWallet.save();

  await booking.save();
  await cleaner.save();

  res.status(200).json({ success: true, booking });
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
  console.log("------------req.user._id--------------", req.user._id);
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

  const start = new Date(booking.CartData[0].TimeSlot.start).getTime(); // Start time in milliseconds

  const now = new Date();
  if (now >= start || now >= start - 15 * 60 * 1000) {
    // Allow access
    console.log("User can proceed.");

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    booking.OTP.start = otp;

    await booking.save();

    res.status(200).json({ success: true, message: "OTP sent", otp });
  } else {
    // Deny access
    console.log("User has to wait.");
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
