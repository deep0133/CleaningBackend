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

// Cleaner Actions:
router.post("/acceptBooking", isAuthenticated, acceptBooking);
router.post("/startService", isAuthenticated, startService);
router.post("/endService", isAuthenticated, endService);

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
