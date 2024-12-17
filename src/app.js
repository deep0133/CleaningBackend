import express from "express";
const app = express();
import userRouter from "./routes/user.router.js";
import bookingRouter from "./routes/booking.routes.js";
import cors from "cors";

import otp from './routes/otp.router.js'
import manageServiceRouter from "./routes/adminManageService.routes.js";


app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))

app.use(express.json());

app.use('/images',express.static('uploads'))

app.use(express.urlencoded({
    limit:"16kb",
    extended:true
}))

app.use("/api/v1/users",userRouter);
app.use("/api/v1/otp",otp)
app.use("/api/v1/admin", manageServiceRouter);
app.use("/api/v1/booking", bookingRouter);


app.use("/", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to the API",
  });
});

export { app };

