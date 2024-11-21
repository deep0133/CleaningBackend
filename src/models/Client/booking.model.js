
import mongoose from "mongoose";
import { required } from "nodemon/lib/config";

const bookingSchema = mongoose.Schema(
    {
        User: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        category: {
            type: String,
            enum:["basic cleaning","deep cleaning"],
            required: true,
        },
        PaymentMethod: {
            type: String,
            required: true,
            enum:["card","cash","online"]
        },
        PaymentValue: {
            type: String,
        },
        PaymentStatus: {
            type: String,
            required: true,
            enum:['paid',"pending","failed"]
        },
        BookingStatus: {
            type: Boolean,
            required: true,
        },
        TimeSlot: {
            start: { type: Date, required: true }, 
      end: { type: Date, required: true }, 

        },
       serviceType:{
        type:String,
        enum:["cleaning","others"]
       }


    }, {
    timestamps: true
}
)

export const BookingService = mongoose.model("Booking", bookingSchema)