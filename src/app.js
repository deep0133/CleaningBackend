import cors from "cors";
import express from "express";
import bookingRouter from "./routes/booking.routes.js";
import userRouter from "./routes/user.routes.js";
import cleanerRouter from "./routes/cleaner.routes.js";
import otpRouter from "./routes/otp.router.js";
import manageServiceRouter from "./routes/adminManageService.routes.js";
import addOnsRouter from "./routes/addOns.routes.js";
import cartRouter from "./routes/cart.routes.js";
import { verifyStripePayment } from "./controllers/payment/verifyPaymentWebhook.js";
import { balanceWebhook } from "./controllers/payment/balanceWebhook.js";
import walletRouter from "./routes/adminWallet.routes.js";

const app = express();

app.use(cors());

app.use(
  express.json({
    verify(req, res, buf, encoding) {
      if (req.path.includes("webhook")) {
        req.rawBody = buf.toString(); // sets raw string in req.rawBody variable
      }
    },
  })
);

app.use(
  express.urlencoded({
    limit: "16kb",
    extended: true,
  })
);

app.use("/images", express.static("uploads"));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/otp", otpRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/booking", bookingRouter);

// Admin routes
app.use("/api/v1/admin", manageServiceRouter);
app.use("/api/v1/admin/addons", addOnsRouter);
app.use("/api/v1/admin/wallet", walletRouter);
app.use("/api/v1/admin/cleaner", cleanerRouter);

// Stripe webhooks (must come after other routes, but before body parsing)
app.post("/webhook/paymentStatus", verifyStripePayment);
app.post("/webhook/balance", balanceWebhook);

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
