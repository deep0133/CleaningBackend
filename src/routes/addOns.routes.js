import express from "express";
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser.js";
import {
  createAddOn,
  getAllAddOns,
  getAddOnById,
  updateAddOn,
  deleteAddOn,
} from "../controllers/addons/addOns.controller.js";

const addOnsRouter = express.Router();

addOnsRouter.post("/create-addons", isAuthenticated, isAdmin, createAddOn);
addOnsRouter.get("/get-addons", getAllAddOns);
addOnsRouter.get("/get-addons/:id", getAddOnById);
addOnsRouter.put("/update-addons/:id", isAuthenticated, isAdmin, updateAddOn);
addOnsRouter.delete(
  "/remove-addons/:id",
  isAuthenticated,
  isAdmin,
  deleteAddOn
);

export default addOnsRouter;
