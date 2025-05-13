import express from "express";
import { verifyCleaner } from "../controllers/admin/verifyCleaner.js";
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser.js";
const router = express.Router();

router.post("/verify", isAuthenticated, isAdmin, verifyCleaner);

export default router;
