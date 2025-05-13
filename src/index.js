import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";
import { initSocketServer } from "./socket/socketConfig.js";

import http from "http";

const server = http.createServer(app);

dotenv.config({
  path: "./.env",
});

initSocketServer(server);

connectDB()
  .then(
    server.listen(process.env.PORT, () => {
      console.log("Server is listening at port", process.env.PORT);
    })
  )
  .catch((err) => {
    console.log("Database connection failed !!!!", err);
  });
