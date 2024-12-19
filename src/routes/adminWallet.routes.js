import express from 'express';
import { isAdmin, isAuthenticated } from '../middleware/authenticateUser.js';
import {
    getWalletDetails,
    updateWalletOnBooking,
    handleOrderCancellation
} from '../controllers/adminWalltController/adminWallet.controller.js';

const walletRouter = express.Router();

walletRouter.get('/details', isAdmin, isAuthenticated, getWalletDetails);
walletRouter.post('/update-booking', isAdmin, isAuthenticated, updateWalletOnBooking);
walletRouter.post('/process-refund', isAdmin, isAuthenticated, handleOrderCancellation);

export default walletRouter;