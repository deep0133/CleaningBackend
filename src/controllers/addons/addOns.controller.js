
import AddOnModel from "../../models/Services/addons.model.js";

// Create a new add-on
export const createAddOn = async (req, res) => {
    try {
        const addOn = new AddOnModel(req.body);
        const savedAddOn = await addOn.save();
        res.status(201).json({
            success: true,
            data: savedAddOn
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all add-ons
export const getAllAddOns = async (req, res) => {
    try {
        const addOns = await AddOnModel.find();
        res.status(200).json({
            success: true,
            count: addOns.length,
            data: addOns
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get single add-on by ID
export const getAddOnById = async (req, res) => {
    try {
        const addOn = await AddOnModel.findById(req.params.id);
        if (!addOn) {
            return res.status(404).json({
                success: false,
                error: 'Add-on not found'
            });
        }
        res.status(200).json({
            success: true,
            data: addOn
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update add-on by ID
export const updateAddOn = async (req, res) => {
    try {
        const addOn = await AddOnModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );
        
        if (!addOn) {
            return res.status(404).json({
                success: false,
                error: 'Add-on not found'
            });
        }

        res.status(200).json({
            success: true,
            data: addOn
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete add-on by ID
export const deleteAddOn = async (req, res) => {
    try {
        const addOn = await AddOnModel.findByIdAndDelete(req.params.id);
        
        if (!addOn) {
            return res.status(404).json({
                success: false,
                error: 'Add-on not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};