  import mongoose from "mongoose";

  const AddOnSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true }, // Price in smallest currency unit (e.g., cents or paise)
  });

  const AddOnModel = mongoose.model("AddOns", AddOnSchema);
  export default AddOnModel;
