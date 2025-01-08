import cors from "cors";
import express from "express";
import bookingRouter from "./routes/booking.routes.js";
import userRouter from "./routes/user.routes.js";
import adminCleanerRouter from "./routes/adminCleaner.routes.js";
import otpRouter from "./routes/otp.routes.js";
import manageServiceRouter from "./routes/adminManageService.routes.js";
import addOnsRouter from "./routes/addOns.routes.js";
import cartRouter from "./routes/cart.routes.js";
import { verifyStripePayment } from "./controllers/payment/verifyPaymentWebhook.js";
import { balanceWebhook } from "./controllers/payment/balanceWebhook.js";
import walletRouter from "./routes/adminWallet.routes.js";
// import { findNearbyCleanersController } from "./utils/findNearByUser.js";
import cleanerRouter from "./routes/cleaner.routes.js";
import adminAuth from "./routes/adminRoutes.js";
import morgan from "morgan";
import { KnowledgeContextImpl } from "twilio/lib/rest/assistants/v1/knowledge.js";

const app = express();

app.use(cors());

app.use(morgan("dev"));

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

// user routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/otp", otpRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/booking", bookingRouter);

// cleaner routes
app.use("/api/v1/cleaner", cleanerRouter);

// Admin routes
app.use("/api/v1/admin/auth", adminAuth);
app.use("/api/v1/admin", manageServiceRouter);
app.use("/api/v1/admin/addons", addOnsRouter);
app.use("/api/v1/admin/wallet", walletRouter);
app.use("/api/v1/admin/cleaner", adminCleanerRouter);

// Stripe webhooks (must come after other routes, but before body parsing)
app.post("/webhook/paymentStatus", verifyStripePayment);
app.post("/webhook/balance", balanceWebhook);
// app.post("/api/v1/findNearbyCleaners", findNearbyCleanersController);

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
