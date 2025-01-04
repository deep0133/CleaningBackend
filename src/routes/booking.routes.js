import { Router } from "express";
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
router.post("/nearByCleaner", isAuthenticated, getNearbyCleaners);
router.post("/getStartOtp/:bookingId", isAuthenticated, sendStartOtp);
router.post("/getEndOtp/:bookingId", isAuthenticated, sendEndOtp);

// Cleaner Actions:
router.post("/acceptBooking/:id", isAuthenticated, acceptBooking);
router.post("/startService", isAuthenticated, isCleaner, startService);
router.post("/endService", isAuthenticated, isCleaner, endService);

router.get("/getUserBookings", isAuthenticated, getUserBookings);
router.get(
  "/getCleanerBookings",
  isAuthenticated,
  isCleaner,
  getCleanerBookings
);
router.get("/getBookingById/:id", isAuthenticated, getBookingById);

//  -----------------------Admin Actions-----------------------:
router.get(
  "/getAllUpcomingBookings",
  isAuthenticated,
  isAdmin,
  getAllUpcomingBookings
);
router.get("/getAllPastBookings", isAuthenticated, isAdmin, getAllPastBookings);
router.get("/getCurrentBookings", isAuthenticated, isAdmin, getCurrentBookings);

export default router;
