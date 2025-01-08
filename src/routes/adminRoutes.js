import express from "express";
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser.js";
import {
  createdByAdmin,
  loginAdmin,
} from "../controllers/admin/editUser.controller.js";
const router = express.Router();

router.post("/login", loginAdmin);

router.post("/add", isAuthenticated, isAdmin, createdByAdmin);

export default router;
