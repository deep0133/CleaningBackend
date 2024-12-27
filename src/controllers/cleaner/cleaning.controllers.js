import ServiceModel from "../../models/Services/services.model.js";
import { validationResult } from "express-validator";
import {asyncHandler} from '../../utils/asyncHandler.js'
import mongoose from "mongoose";


  const getCleaningServices = async (req, res) => {
    try {
      const services = await ServiceModel.find({});
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    let imgFileName = `${req.file.filename}`;
  
    try {
      const { name, description, pricePerHour } = req.body;
      let addOns = req.body.addOns;
  
      console.log('Received addOns:', addOns);
  
      // Handle the addOns array
      let addOnsArray = [];
      if (addOns) {
        // If it's an array, process each element
        if (Array.isArray(addOns)) {
          // Join all elements and split by comma
          const addOnsString = addOns.join(',');
          addOnsArray = addOnsString
            .split(',')
            .map(id => id.trim())
            .filter(id => id !== ''); // Remove empty strings
        } else if (typeof addOns === 'string') {
          // If it's a string, just split by comma
          addOnsArray = addOns
            .split(',')
            .map(id => id.trim())
            .filter(id => id !== '');
        }
      }
  
      // Validate required fields
      if (!name || !pricePerHour) {
        return res.status(400).json({ message: "Name and pricePerHour are required" });
      }
  
      // Convert valid IDs to ObjectId
      // const validAddOns = addOnsArray.map(id => {
      //   if (!mongoose.Types.ObjectId.isValid(id)) {
      //     throw new Error(`Invalid addOn ID: ${id}`);
      //   }
      //   return new mongoose.Types.ObjectId(id);
      // });
  const cleanAddOns = addOns
      .join(',')
      .replace(/[\[\]'"\s]/g, '')
      .split(',')
      .filter(id => id !== ''); // Flatten any nested arrays
  
      const newService = new ServiceModel({
        name,
        description,
        pricePerHour: Number(pricePerHour),
        image: imgFileName,
        addOns:cleanAddOns,
      });
  
      await newService.save();
  
      const populatedService = await ServiceModel.findById(newService._id)
        .populate('addOns');
  
      res.status(201).json({
        message: "Cleaning service created successfully",
        data: populatedService,
      });
  
    } catch (error) {
      console.error('Error details:', error);
      res.status(500).json({ 
        message: "Error creating cleaning service", 
        error: error.message 
      });
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
