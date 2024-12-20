

import express from "express";
const app = express();
import userRouter from "./routes/user.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import cors from "cors";

import otpRouter from "./routes/otp.router.js";
import manageServiceRouter from "./routes/adminManageService.routes.js";
import addOnsRouter from "./routes/addOns.routes.js";

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
app.use("/api/v1/otp", otpRouter);
app.use("/api/v1/booking", bookingRouter);

// ---Admin Routes---
app.use("/api/v1/admin", manageServiceRouter);
app.use("/api/v1/admin/addons", addOnsRouter);

// Default route for unhandled paths
app.all("*", (req, res) => {
  res.status(404).json({
    status: "Fail",
    message: "Route not found",
  });
});

export { app };


app.use((err,req,res)=>{
  res.json(
    {
      success:false,
      error:err.message
    }
  )
})
