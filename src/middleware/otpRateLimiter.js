import rateLimit from "express-rate-limit";

export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 OTP requests per IP
    message: "Too many OTP requests, please try again later.",
  });