import express from "express";
import {
  addOrUpdateAccountDetails,
  addReview,
  getAllCleaners,
  getAllReview,
  getCleanerNotification,
  getProfile,
  getSingleReview,
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

//  Get All Review-----------
router.get("/getAllReview", isAuthenticated, getAllReview);
router.get("/getSingleReview/:id", isAuthenticated, getSingleReview);
router.post("/addReview", isAuthenticated, addReview);

export default router;
