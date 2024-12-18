import express from 'express';

import {createAddOn, getAllAddOns, getAddOnById, updateAddOn, deleteAddOn} from '../controllers/addons/addOns.controller.js';

const addOnsRouter = express.Router();

addOnsRouter.post('/create-addons', createAddOn);
addOnsRouter.get('/get-addons', getAllAddOns);
addOnsRouter.get('/get-addons/:id', getAddOnById);
addOnsRouter.put('/update-addons:id', updateAddOn);
addOnsRouter.delete('/remove-addons/:id', deleteAddOn);

export default addOnsRouter;