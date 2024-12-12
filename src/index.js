import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";
import { Server } from "socket.io";

import http from "http";

const server = http.createServer(app);

export const io = new Server(server);
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(
    app.listen(process.env.PORT, () => {
      console.log("Server is listening at port", process.env.PORT);
    })
  )
  .catch((err) => {
    console.log("Database connection failed !!!!", err);
  });
