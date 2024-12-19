import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser.js";
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

router.post("/getUserBookings", isAuthenticated, getUserBookings);
router.post("/getCleanerBookings", isAuthenticated, getCleanerBookings);
router.post("/getBookingById", isAuthenticated, getBookingById);

// Cleaner Actions:
router.post("/acceptBooking", isAuthenticated, acceptBooking);
router.post("/startService", isAuthenticated, startService);
router.post("/endService", isAuthenticated, endService);

router.post(
  "/getAllUpcomingBookings",
  isAuthenticated,
  isAdmin,
  getAllUpcomingBookings
);
router.post(
  "/getAllPastBookings",
  isAuthenticated,
  isAdmin,
  getAllPastBookings
);
router.post("/getCurrentBookings", isAuthenticated, getCurrentBookings);

export default router;
