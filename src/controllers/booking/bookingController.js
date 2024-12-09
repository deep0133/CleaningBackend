import { BookingService } from "../../models/Client/booking.model.js";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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
    coordinates: [77.1025, 28.7041], // longitude, latitude
  },
};
export const createBooking = asyncHandler(async (req, res) => {
  const {
    category,
    timeSlot,
    paymentMethod,
    paymentValue,
    userAddress,
    location,
  } = req.body;

  const booking = await BookingService.create({
    User: req.user._id, // User ID from JWT
    category,
    PaymentMethod: paymentMethod,
    PaymentValue: paymentValue,
    PaymentStatus: "pending",
    BookingStatus: false, // Pending until a cleaner accepts
    TimeSlot: timeSlot,
    UserAddress: userAddress,
    Location: location,
  });

  // Find nearby cleaners (to send requests asynchronously)
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

  // Notify cleaners (via a queue or socket logic)
  nearbyCleaners.forEach((cleaner) => {
    // Send a request (example: Twilio SMS or socket message)
    console.log(`Notified cleaner: ${cleaner.user}`);
  });

  res.status(201).json({ success: true, booking });
});

// Allows the user to see available cleaners before they finalize a booking.
export const getNearbyCleaners = asyncHandler(async (req, res) => {
  const { location, category } = req.query;

  const [longitude, latitude] = location.split(",");

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

  res.status(200).json({ success: true, cleaners });
});

// Cleaners only, as they are the ones accepting the booking.
export const acceptBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await BookingService.findById(id);

  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  // Ensure cleaner is available
  const cleaner = await Cleaner.findOne({
    user: req.user._id,
    availability: true,
  });

  if (!cleaner) {
    return res
      .status(400)
      .json({ success: false, message: "Cleaner not available" });
  }

  // Update booking and cleaner
  booking.Cleaner = cleaner._id;
  booking.BookingStatus = true; // Accepted
  await booking.save();

  cleaner.availability = false; // Mark cleaner as unavailable
  cleaner.currentBooking = booking._id;
  await cleaner.save();

  res.status(200).json({ success: true, message: "Booking accepted", booking });
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
