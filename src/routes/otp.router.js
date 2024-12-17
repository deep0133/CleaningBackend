

import { Router } from "express";

const router = Router();
import { verifyOtpController } from "../controllers/user/user.controller.js";

router.post("/verify",verifyOtpController);
export default router;