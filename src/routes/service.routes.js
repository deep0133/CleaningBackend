import express from "express";
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser.js";
import {
  getCleaningServices,
  createCleaningService,
  updateCleaningService,
  deleteCleaningService,
} from "../controllers/cleaner/cleaning.controllers.js";
const serviceRouter = express.Router();

serviceRouter.get("/services", getCleaningServices);
serviceRouter.post(
  "/service/create",
  isAuthenticated,
  isAdmin,
  createCleaningService
);
serviceRouter.put(
  "/service/update/:id",
  isAuthenticated,
  isAdmin,
  updateCleaningService
);
serviceRouter.delete(
  "/service/delete/:id",
  isAuthenticated,
  isAdmin,
  deleteCleaningService
);
export default serviceRouter;
