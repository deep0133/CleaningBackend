import { Router } from "express";
import { createNotification } from "../controllers/notification/notificationController.js";
import { readNotification } from "../controllers/notification/notificationController.js";

const router = Router();

// router.get("/getNotifications", getAllNotifications);
router.post("/createNotification", createNotification);
router.post("/readNotification/:notificationId", readNotification);

export default router;