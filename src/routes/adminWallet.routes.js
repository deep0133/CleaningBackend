import express from "express";
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser.js";
import {
  getWalletDetails,
  updateWalletOnBooking,
  handleOrderCancellation,
  setCommission,
} from "../controllers/adminWalltController/adminWallet.controller.js";

const walletRouter = express.Router();

walletRouter.get("/details", isAuthenticated, isAdmin, getWalletDetails);
walletRouter.post(
  "/update-booking",
  isAuthenticated,
  isAdmin,
  updateWalletOnBooking
);
walletRouter.post(
  "/process-refund",
  isAuthenticated,
  isAdmin,
  handleOrderCancellation
);

walletRouter.post("/setCommission", isAuthenticated, isAdmin, setCommission);

export default walletRouter;
