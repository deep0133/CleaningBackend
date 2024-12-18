import express from 'express';
import {isAdmin,isAuthenticated} from '../middleware/authenticateUser.js'
import {createAddOn, getAllAddOns, getAddOnById, updateAddOn, deleteAddOn} from '../controllers/addons/addOns.controller.js';

const addOnsRouter = express.Router();


addOnsRouter.post('/create-addons',isAdmin,isAuthenticated, createAddOn);
addOnsRouter.get('/get-addons',isAdmin,isAuthenticated, getAllAddOns);
addOnsRouter.get('/get-addons/:id',isAdmin,isAuthenticated, getAddOnById);
addOnsRouter.put('/update-addons:id', updateAddOn);
addOnsRouter.delete('/remove-addons/:id',isAdmin,isAuthenticated, deleteAddOn);

export default addOnsRouter;