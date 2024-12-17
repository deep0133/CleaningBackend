import ServiceModel from "../../models/Services/services.model.js";
import { validationResult } from "express-validator";


const getCleaningServices = async (req, res) => {
  try {
    const services = await ServiceModel.find();
    res.status(200).json({
      message: "Cleaning services retrieved successfully",
      data: services,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error retrieving cleaning services", error });
  }
};

const createCleaningService = async (req, res) => {
  // Input validation using express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  let imgFileName=`${req.file.filename}`
  try {
    const { name, description, pricePerHour, addOns } = req.body;

    // Additional manual validation for required fields
    if (!name || !pricePerHour) {
      return res.status(400).json({ message: "Name and pricePerHour are required" });
    }

    // Creating a new service instance
    const newService = new ServiceModel({
      name,
      description,
      pricePerHour,
      image:imgFileName,
      addOns,
    });

    // Save to database
    await newService.save();

    // Return success response
    res.status(201).json({
      message: "Cleaning service created successfully",
      data: newService,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating cleaning service", error });
  }
};

const updateCleaningService = async (req, res) => {
  try {
    const { id } = req.params;
    const { services } = req.body;

    const updatedService = await ServiceModel.findByIdAndUpdate(
      id,
      { services },
      { new: true }
    );
    if (!updatedService) {
      return res.status(404).json({ message: "Cleaning service not found" });
    }

    res.status(200).json({
      message: "Cleaning service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating cleaning service", error });
  }
};

const deleteCleaningService = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedService = await ServiceModel.findByIdAndDelete(id);

    if (!deletedService) {
      return res.status(404).json({ message: "Cleaning service not found" });
    }

    res.status(200).json({
      message: "Cleaning service deleted successfully",
      data: deletedService,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting cleaning service", error });
  }
};

export {createCleaningService,deleteCleaningService,updateCleaningService,getCleaningServices}
