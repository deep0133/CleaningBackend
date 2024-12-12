import { Router } from "express";
import { registerClient } from "../controllers/user/client.controller";

const router = Router()

router.route('clientRegister').post(registerClient);

export default router;