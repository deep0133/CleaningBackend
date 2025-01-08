import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
const router = express.Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email && !password) {
      return res.status(404).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
    const admin = await User.findOne({ email: email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    if (admin?.role !== "admin") {
      return res.status(404).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const isPasswordValid = await admin.isPasswordCorrect(password);

    if (!isPasswordValid === false) {
      return res.status(404).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const accessToken = await admin.generateAccessToken();
    const refreshToken = await admin.generateRefreshToken();
    res.status(200).json({
      success: true,
      message: "Login Successfull",
      accessToken,
      refreshToken,
    });
  })
);

export default router;
