import { Router } from "express";
import { isAuthenticated } from "../middleware/authenticateUser.js";
import {
  acceptBooking,
  createBooking,
  endService,
  getNearbyCleaners,
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

export default router;
