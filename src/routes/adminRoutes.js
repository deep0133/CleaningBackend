import express from "express";
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser.js";
import {
  createdByAdmin,
  loginAdmin,
} from "../controllers/admin/editUser.controller.js";
import { pendingBookings } from "../controllers/admin/pendingBookings.controller.js";
import { getGeneralInfo } from "../controllers/admin/dashboar.controller.js";
const router = express.Router();

router.post("/login", loginAdmin);

router.post("/add", isAuthenticated, isAdmin, createdByAdmin);

router.get("/getGeneralInfo", isAuthenticated, isAdmin, getGeneralInfo);
router.get("/pendingBookings",isAuthenticated,isAdmin,pendingBookings);
export default router;
