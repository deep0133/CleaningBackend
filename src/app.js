import express from "express";
const app = express();
import userRouter from "./routes/user.router.js";
import cors from "cors";

app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
app.use(
  express.urlencoded({
    limit: "16kb",
    extended: true,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true,
  })
);

app.use("/api/v1/users", userRouter);
// app.use("/api/v1/booking", );

export { app };
