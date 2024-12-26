import cors from "cors";
import express from "express";
import bookingRouter from "./routes/booking.routes.js";
import userRouter from "./routes/user.routes.js";
import otpRouter from "./routes/otp.router.js";
import manageServiceRouter from "./routes/adminManageService.routes.js";
import addOnsRouter from "./routes/addOns.routes.js";
import cartRouter from "./routes/cart.routes.js";
import { verifyStripePayment } from "./controllers/payment/verifyPaymentWebhook.js";
import { balanceWebhook } from "./controllers/payment/balanceWebhook.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true,
  })
);

// app.use(express.raw({ type: "application/json" }));
// app.use(express.json());

app.use("/images", express.static("uploads"));

// app.use(
//   express.urlencoded({
//     limit: "16kb",
//     extended: true,
//   })
// );

// ---User Routes---
app.use("/api/v1/users", express.json(), userRouter);
app.use("/api/v1/otp", express.json(), otpRouter);
app.use("/api/v1/cart", express.json(), cartRouter);
app.use("/api/v1/booking", express.json(), bookingRouter);

// ---Admin Routes---
app.use("/api/v1/admin", express.json(), manageServiceRouter);
app.use("/api/v1/admin/addons", express.json(), addOnsRouter);

// app.post("/webhook/paymentStatus", verifyStripePayment);
// app.post("/webhook/balance", balanceWebhook);
// Stripe webhooks (must come after other routes, but before body parsing)
app.post(
  "/webhook/paymentStatus",
  express.raw({ type: "application/json" }),
  verifyStripePayment
);
app.post(
  "/webhook/balance",
  express.raw({ type: "application/json" }),
  balanceWebhook
);

// Default route for unhandled paths
app.all("*", (req, res) => {
  res.status(404).json({
    status: "Fail",
    message: "Route not found",
  });
});

export { app };

app.use((err, req, res, next) => {
  res.json({
    success: false,
    error: err.message,
  });
});
