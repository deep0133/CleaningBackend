import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser.js";
import {
  acceptBooking,
  endService,
  getNearbyCleaners,
  startService,
} from "../controllers/booking/bookingController.js";
const router = Router();

// User Actions:
router.post("/createBooking", isAuthenticated, createBooking);
router.post("/nearByCleaner", isAuthenticated, getNearbyCleaners);

// Cleaner Actions:
router.post("/acceptBooking", isAuthenticated, acceptBooking);
router.post("/startService", isAuthenticated, startService);
router.post("/endService", isAuthenticated, endService);

export default router;
