const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String }, // Optional description
    pricePerDay: { type: Number, required: true }, // Price in smallest currency unit
    image: { type: String }, // URL for the service icon/image
    addOns: [AddOnSchema], // Array of add-ons
  });
const ServiceModel=mongoose.model("Services", ServiceSchema);
export default ServiceModel