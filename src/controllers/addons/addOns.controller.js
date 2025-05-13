import AddOnModel from "../../models/Services/addons.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Create a new add-on
export const createAddOn = asyncHandler(async (req, res) => {
  const { name, description, price } = req.body;
  if (!name || !description || !price) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }
  const addOn = new AddOnModel({
    name,
    description,
    price,
  });
  const savedAddOn = await addOn.save();
  res.status(201).json({
    success: true,
    data: savedAddOn,
  });
});

// Get all add-ons
export const getAllAddOns = asyncHandler(async (req, res) => {
  const addOns = await AddOnModel.find();
  res.status(200).json({
    success: true,
    count: addOns?.length,
    data: addOns,
  });
});

// Get single add-on by ID
export const getAddOnById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const addOn = await AddOnModel.findById(id);
  if (!addOn) {
    return res.status(404).json({
      success: false,
      error: "Add-on not found",
    });
  }
  res.status(200).json({
    success: true,
    data: addOn,
  });
});

// Update add-on by ID
export const updateAddOn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;

  const addOn = await AddOnModel.findById(id);

  if (!addOn) {
    return res.status(404).json({
      success: false,
      error: "Add-on not found",
    });
  }

  if (name) addOn.name = name;
  if (description) addOn.description = description;
  if (price) addOn.price = price;

  await addOn.save();

  res.status(200).json({
    success: true,
    data: addOn,
  });
});

// Delete add-on by ID
export const deleteAddOn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const addOn = await AddOnModel.findByIdAndDelete(req.params.id);

  if (!addOn) {
    return res.status(404).json({
      success: false,
      error: "Add-on not found",
    });
  }

  res.status(200).json({
    success: true,
    data: {},
  });
});
