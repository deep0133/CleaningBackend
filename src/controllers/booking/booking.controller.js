import { BookingService } from "../../models/Client/booking.model.js";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import ServiceModel from '../../models/Services/services.model.js'

import crypto from "crypto";

const createBookingRequestData = {
  category: "basic cleaning",
  timeSlot: {
    start: "2024-12-06T10:00:00.000Z",
    end: "2024-12-06T12:00:00.000Z",
  },
  paymentMethod: "card",
  paymentValue: 50,
  userAddress: "1234 Elm Street",
  location: {
    type: "Point",
    coordinates: [77.1025, 28.7041], 
  },
};

// export const createBooking = asyncHandler(async (req, res) => {
//   const {
//     category,
//     timeSlot,
//     paymentMethod,
//     paymentValue,
//     userAddress,
//     location,
//   } = req.body;

//   // Validate required fields
//   if (!category || !timeSlot || !paymentMethod || !userAddress || !location) {
//     return res.status(400).json({
//       success: false,
//       message: "All fields are required",
//     });
//   }

//   // Check if the payment value is valid
//   if (!paymentValue || paymentValue <= 0) {
//     return res.status(400).json({
//       success: false,
//       message: "Payment value must be greater than zero",
//     });
//   }

//   const booking = await BookingService.create({
//     User: req.user._id, // User ID from JWT
//     category,
//     PaymentMethod: paymentMethod,
//     PaymentValue: paymentValue,
//     PaymentStatus: "pending",
//     BookingStatus: false, // Pending until a cleaner accepts
//     TimeSlot: timeSlot,
//     UserAddress: userAddress,
//     Location: location,
//   });

//   // Find nearby cleaners (to send requests asynchronously)
//   const nearbyCleaners = await Cleaner.find({
//     location: {
//       $near: {
//         $geometry: location,
//         $maxDistance: 10000, // 10 km radius
//       },
//     },
//     category: { $in: [category] },
//     availability: true,
//   });

//   // Notify cleaners (via a queue or socket logic)
//   nearbyCleaners.forEach((cleaner) => {
//     // Send a request (example: Twilio SMS or socket message)
//     console.log(`Notified cleaner: ${cleaner.user}`);
//   });

//   res.status(201).json({ success: true, booking });
// });

// Allows the user to see available cleaners before they finalize a booking.

export const createBooking = asyncHandler(async (req, res) => {
  const {
    category,
    timeSlot, // { start: Date, end: Date }
    paymentMethod,
    paymentValue,
    userAddress,
    location, 
    addOns = [], 
  } = req.body;

  // Validate input
  
  if (!category || !timeSlot || !paymentMethod || !userAddress || !location) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (!timeSlot.start || !timeSlot.end) {
    return res.status(400).json({
      success: false,
      message: "TimeSlot must include start and end times",
    });
  }

  if (new Date(timeSlot.start) >= new Date(timeSlot.end)) {
    return res.status(400).json({
      success: false,
      message: "TimeSlot start time must be before end time",
    });
  }

  if (!paymentValue || paymentValue <= 0) {
    return res.status(400).json({
      success: false,
      message: "Payment value must be greater than zero",
    });
  }

  // Step 1: Fetch the service based on category
  const service = await ServiceModel.findOne({ name: category });
console.log("....service...",service)
  if (!service) {
    return res.status(404).json({
      success: false,
      message: "Service not found",
    });
  }

  // Step 2: Calculate the total price based on the service price and add-ons
  let totalPrice = service.pricePerHour; // Base price for the service

  // Add the price of selected add-ons
  if (addOns.length > 0) {
    for (let addOnId of addOns) {
      const addOn = await AddOnModel.findById(addOnId); // Find each add-on by its ID
      if (addOn) {
        totalPrice += addOn.price; // Add the add-on price to the total
      }
    }
  }

  // Step 3: Validate that the payment value matches the calculated total price
  if (paymentValue !== totalPrice) {
    return res.status(400).json({
      success: false,
      message: `Payment amount should be ${totalPrice}, but received ${paymentValue}`,
    });
  }

  // Calculate duration in minutes
  const duration = Math.round(
    (new Date(timeSlot.end) - new Date(timeSlot.start)) / (1000 * 60)
  );

  // Begin transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 4: Create the booking document
    const booking = new BookingService({
      User: req.user._id, // User ID from JWT
      category,
      PaymentMethod: paymentMethod,
      PaymentValue: paymentValue,
      PaymentStatus: "pending", // Initial status
      BookingStatus: false, // Pending until a cleaner accepts
      TimeSlot: timeSlot,
      OTP: {
        start: Math.floor(1000 + Math.random() * 9000).toString(), // Random 4-digit OTP
        end: Math.floor(1000 + Math.random() * 9000).toString(),
      },
      Duration: duration, // Calculated duration in minutes
      TotalPrice: totalPrice, // Set the total price
      UserAddress: userAddress,
      Location: location,
    });

    // Save booking to the database within a transaction
    await booking.save({ session });

    // Step 5: Razorpay order creation if paymentMethod is "online"
    let razorpayOrder = null;
    if (paymentMethod === "online") {
      const amountInPaisa = totalPrice * 100; // Convert to paisa
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaisa,
        currency: "INR",
        receipt: `receipt_${booking._id}`, // Unique receipt for this booking
      });

      // Store the Razorpay order ID in the booking document
      booking.razorpayOrderId = razorpayOrder.id;
      await booking.save({ session }); // Save updated booking with Razorpay order ID
    }

    // Step 6: Find nearby cleaners who match the category and are available
    const nearbyCleaners = await Cleaner.find({
      location: {
        $near: {
          $geometry: location,
          $maxDistance: 10000, // 10 km radius
        },
      },
      category: { $in: [category] },
      availability: true,
    });

    // Notify cleaners (this should be done asynchronously, e.g., via SMS or WebSocket)
    nearbyCleaners.forEach((cleaner) => {
      console.log(`Notified cleaner: ${cleaner.user}`);
      // Replace this with actual notification logic (e.g., SMS, email, WebSocket)
    });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return response with the Razorpay order details if available
    res.status(201).json({
      success: true,
      booking,
      razorpayOrder: razorpayOrder || null, // Send Razorpay order details if it's an online payment
    });
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

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  // 1. Prepare the body string for verification
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  // 2. Generate the expected signature using the key secret
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  // 3. Compare the generated signature with the Razorpay signature
  if (expectedSignature === razorpay_signature) {
    try {
      // 4. Payment is verified, so update the payment status in your booking model
      const booking = await BookingService.findOne({
        razorpayOrderId: razorpay_order_id,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found for this order",
        });
      }

      // Update the booking status and payment details
      booking.PaymentStatus = "paid"; // Mark the payment as successful
      booking.BookingStatus = true; // Mark the booking as confirmed
      await booking.save();

      // 5. Find nearby cleaners who are available (based on location and category)
      const nearbyCleaners = await Cleaner.find({
        location: {
          $near: {
            $geometry: booking.Location, // Booking's location for proximity
            $maxDistance: 10000, // 10 km radius
          },
        },
        category: { $in: [booking.category] }, // Matching category
        availability: true, // Ensure the cleaner is available
      });

      // 6. Send notification to each nearby cleaner
      nearbyCleaners.forEach((cleaner) => {
        sendNotificationToCleaner(cleaner, booking); // Send notification to each cleaner
      });

      // Send the response to the client
      res.status(200).json({
        success: true,
        message: "Payment verified and nearby cleaners notified successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error occurred while verifying the payment",
      });
    }
  } else {
    // Signature mismatch error
    res.status(400).json({
      success: false,
      message: "Invalid payment signature",
    });
  }
};

export const getNearbyCleaners = asyncHandler(async (req, res) => {
  const { location, category } = req.query;



  if (!location) {
    return res.status(400).json({ success: false, message: "Location is required" });
  }

  const coordinates = location.split(",");
  if (coordinates.length !== 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
    return res.status(400).json({ success: false, message: "Invalid location format" });
  }

  const [longitude, latitude] = coordinates.map(Number);


  const cleaners = await Cleaner.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        $maxDistance: 10000, // 10 km
      },
    },
    category: { $in: [category] },
    availability: true,
  });
   
  console.log(cleaners.location);
  res.status(200).json({ success: true, cleaners });
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
