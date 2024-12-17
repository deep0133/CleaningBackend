import express from "express";
const app = express();
import userRouter from "./routes/user.router.js";
import bookingRouter from "./routes/booking.routes.js";
import cors from "cors";

import otp from './routes/otp.router.js'


app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))

app.use(express.json());

app.use(express.urlencoded({
    limit:"16kb",
    extended:true
}))






app.use("/api/v1/users",userRouter);
app.use("/api/v1/otp",otp)
app.use("/api/v1/booking", bookingRouter);


app.use("/", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to the API",
  });
});
app.use("/api", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to the new made API",
  });
});
export { app };

