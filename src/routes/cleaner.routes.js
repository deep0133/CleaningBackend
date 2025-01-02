import express from "express";
import { verifyCleaner } from "../controllers/admin/cleaner/verifyCleaner";
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser";
const router = express.Router();

router.post("/verify", isAuthenticated, isAdmin, verifyCleaner);

export default router;
