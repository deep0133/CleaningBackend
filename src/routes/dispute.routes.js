import express from "express";
import {
  createDispute,
  getAllDisputes,
} from "../controllers/dispute/disputeController.js";
const router = express.Router();
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser.js";

router.get("/all", isAuthenticated, isAdmin, getAllDisputes);
router.get("/single/:id", isAuthenticated, isAdmin, getAllDisputes);
router.post("/create", isAuthenticated, createDispute);

export default router;
