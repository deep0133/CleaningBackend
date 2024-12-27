import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String }, // Optional description
  pricePerHour: { type: Number, required: true }, // Price in smallest currency unit
  image: { type: String }, // URL for the service icon/image
<<<<<<< HEAD
  addOns: {
    type:Array
  }
})
    

=======
  addOns: [
    {
      // type: mongoose.Schema.Types.ObjectId,
      // ref: "AddOns",
      type: String,
    },
  ], // Array of add-ons
});
>>>>>>> ca70afaa2f2cd617a9b328e239203babd084a775
const ServiceModel = mongoose.model("Services", ServiceSchema);
export default ServiceModel;

