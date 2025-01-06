import express from "express";
import {
  addOrUpdateAccountDetails,
  getAllCleaners,
  getCleanerNotification,
  getProfile,
} from "../controllers/cleaner/cleaner.controller.js";
import { isAuthenticated, isCleaner } from "../middleware/authenticateUser.js";
const router = express.Router();

router.get("/myProfile", isAuthenticated, isCleaner, getProfile);
router.get("/getAllCleaners", isAuthenticated, getAllCleaners);

router.post(
  "/addOrupdate",
  isAuthenticated,
  isCleaner,
  addOrUpdateAccountDetails
);

router.get("/notification", isAuthenticated, isCleaner, getCleanerNotification);
export default router;
