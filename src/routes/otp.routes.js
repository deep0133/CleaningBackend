

import { Router } from "express";

const router = Router();
// import { verifyOtpController } from "../controllers/user/user.controller.js";
import { otpSend, otpVerification } from "../controllers/otp/otp.controller.js";

// router.post("/verify",verifyOtpController);
router.post("/otpVerification",otpVerification)
router.post("/sendOtp",otpSend)
export default router;