import ServiceModel from "../models/Services/services.model.js";

createCleaningService = async (req, res) => {
  try {
    const { services } = req.body;
    const newService = new ServiceModel({ services });
    await newService.save();
    res.status(201).json({
      message: "Cleaning service created successfully",
      data: newService,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating cleaning service", error });
  }
};

updateCleaningService = async (req, res) => {
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

deleteCleaningService = async (req, res) => {
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
