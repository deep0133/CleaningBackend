

import { Router } from "express";

const router = Router();
// import { verifyOtpController } from "../controllers/user/user.controller.js";
import { otpSend, otpVerification } from "../controllers/otp/otp.controller.js";
import { otpLimiter } from "../middleware/otpRateLimiter.js";

// router.post("/verify",verifyOtpController);
router.post("/otpVerification",otpVerification)
router.post("/sendOtp",otpLimiter,otpSend)
export default router;