import { Router } from "express";
import {
  acceptBooking,
  createBooking,
  endService,
  getAllBookings,
  getAllPastBookings,
  getAllUpcomingBookings,
  getBookingById,
  getCleanerBookings,
  getCurrentBookings,
  // getNearbyCleaners,
  getUserBookings,
  sendEndOtp,
  sendStartOtp,
  startService,
} from "../controllers/booking/bookingController.js";
import {
  isAdmin,
  isAuthenticated,
  isCleaner,
} from "../middleware/authenticateUser.js";
const router = Router();

// User Actions:
router.post("/createBooking", isAuthenticated, createBooking);
// router.post("/nearByCleaner", isAuthenticated, getNearbyCleaners);
router.get("/getStartOtp/:bookingId", isAuthenticated, sendStartOtp);
router.get("/getEndOtp/:bookingId", isAuthenticated, sendEndOtp);

// Cleaner Actions:
router.post("/acceptBooking/:id", isAuthenticated, acceptBooking);
router.post(
  "/startService/:bookingId",
  isAuthenticated,
  isCleaner,
  startService
);
router.post("/endService/:bookingId", isAuthenticated, isCleaner, endService);

router.get("/getUserBookings", isAuthenticated, getUserBookings);
router.get(
  "/getCleanerBookings",
  isAuthenticated,
  isCleaner,
  getCleanerBookings
);
router.get("/getBookingById/:id", isAuthenticated, getBookingById);

//  -----------------------Admin Actions-----------------------:
router.get("/getAllBookings", isAuthenticated, isAdmin, getAllBookings);
router.get(
  "/getAllUpcomingBookings",
  isAuthenticated,
  isAdmin,
  getAllUpcomingBookings
);
router.get("/getAllPastBookings", isAuthenticated, isAdmin, getAllPastBookings);
router.get("/getCurrentBookings", isAuthenticated, isAdmin, getCurrentBookings);

export default router;
