import { Router } from "express";
import { createNotification } from "../controllers/notification/notificationController.js";


const router = Router();

// router.get("/getNotifications", getAllNotifications);
router.post("/createNotification", createNotification);

export default router;