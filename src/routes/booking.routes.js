import { Router } from "express";
import { isAuthenticated } from "../middleware/authenticateUser.js";
import {
  acceptBooking,
  createBooking,
  endService,
  getAllPastBookings,
  getAllUpcomingBookings,
  getBookingById,
  getCleanerBookings,
  getCurrentBookings,
  getNearbyCleaners,
  getUserBookings,
  startService,
  verifyPayment,
} from "../controllers/booking/bookingController.js";
const router = Router();

// User Actions:
router.post("/createBooking", isAuthenticated, createBooking);
router.post("/verifyPayment", isAuthenticated, verifyPayment);
router.post("/nearByCleaner", isAuthenticated, getNearbyCleaners);

// Cleaner Actions:
router.post("/acceptBooking", isAuthenticated, acceptBooking);
router.post("/startService", isAuthenticated, startService);
router.post("/endService", isAuthenticated, endService);

router.post("/getUserBookings", isAuthenticated, getUserBookings);
router.post("/getCleanerBookings", isAuthenticated, getCleanerBookings);
router.post("/getBookingById", isAuthenticated, getBookingById);

router.post("/getAllUpcomingBookings", isAuthenticated, getAllUpcomingBookings);
router.post("/getAllPastBookings", isAuthenticated, getAllPastBookings);
router.post("/getCurrentBookings", isAuthenticated, getCurrentBookings);

export default router;
