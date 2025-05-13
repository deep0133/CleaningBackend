import { Router } from "express";
import {getNotifications} from "../controllers/client/getNotification.controller.js"
import {isAuthenticated} from '../middleware/authenticateUser.js'

const clientRouter = Router()


clientRouter.route('/getNotifications').get(isAuthenticated,getNotifications)

export default clientRouter;