import rateLimit from "express-rate-limit";



export const otpLimiter = (req, res, next) => {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 OTP requests per IP
    message: {
      success: false,
      message: 'Too many OTP requests, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });


  limiter(req, res, (err) => {
    if (err) {
 
      console.error('Rate limit error:', err);
      return next(err); // Pass error to the next middleware
    }
    

    next();
  });
};
