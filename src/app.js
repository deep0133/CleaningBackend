import express from "express";
const app = express();
import userRouter from "./routes/user.router.js";
import bookingRouter from "./routes/booking.routes.js";
import cors from "cors";

import otp from './routes/otp.router.js'
import manageServiceRouter from "./routes/adminManageService.routes.js";

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

app.use("/api/v1/users", userRouter);
app.use("/api/v1/otp", otp);
app.use("/api/v1/admin", manageServiceRouter);
app.use("/api/v1/booking", bookingRouter);

// Default route for unhandled paths
app.all("*", (req, res) => {
  res.status(404).json({
    status: "Fail",
    message: "Route not found",
  });
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error("Error occurred:", err.message);
  res.status(500).json({
    status: "Error",
    message: "Something went wrong",
    error: err.message,
  });
});

export { app };
