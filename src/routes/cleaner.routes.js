import express from "express";
import {
  addOrUpdateAccountDetails,
  getProfile,
} from "../controllers/cleaner/cleaner.controller.js";
import { isAuthenticated, isCleaner } from "../middleware/authenticateUser.js";
const router = express.Router();

router.get("/myProfile", isAuthenticated, isCleaner, getProfile);

router.post(
  "/addOrupdate",
  isAuthenticated,
  isCleaner,
  addOrUpdateAccountDetails
);

export default router;
