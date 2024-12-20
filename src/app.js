import cors from "cors";
import express from "express";
import bookingRouter from "./routes/booking.routes.js";
import userRouter from "./routes/user.routes.js";
const app = express();

import addOnsRouter from "./routes/addOns.routes.js";
import manageServiceRouter from "./routes/adminManageService.routes.js";
import otp from "./routes/otp.router.js";
import { verifyStripePayment } from "./controllers/payment/verifyPaymentWebhook.js";
import { balanceWebhook } from "./controllers/payment/balanceWebhook.js";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true,
  })
);

app.use(express.json());

app.use("/images", express.static("uploads"));

app.use(
  express.urlencoded({
    limit: "16kb",
    extended: true,
  })
);

// ---User Routes---
app.use("/api/v1/users", userRouter);
app.use("/api/v1/otp", otp);
app.use("/api/v1/booking", bookingRouter);

// ---Admin Routes---
app.use("/api/v1/admin", manageServiceRouter);
app.use("/api/v1/admin/addons", addOnsRouter);

// Match the raw body to content type application/json
// If you are using Express v4 - v4.16 you need to use body-parser, not express, to retrieve the request body
app.post(
  "/webhook/paymentStatus",
  express.raw({ type: "application/json" }),
  verifyStripePayment
);
app.post("/webhook/balance", balanceWebhook);

// Default route for unhandled paths
app.all("*", (req, res) => {
  res.status(404).json({
    status: "Fail",
    message: "Route not found",
  });
});

export { app };

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error("Error occurred:", err.message);
  res.status(500).json({
    status: "Error",
    message: "Something went wrong",
    error: err.message,
  });
});
