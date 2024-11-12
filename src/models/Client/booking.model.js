
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
            required: true,
        },
        PaymentMethod: {
            type: String,
            required: true
        },
        PaymentValue: {
            type: String,
        },
        PaymentStatus: {
            type: Boolean,
            required: true,
        },
        BookingStatus: {
            type: Boolean,
            required: true,
        },
        TimeSlot: {
            type: String,
            required: true,

        },
       serviceType:{
        type:String,
        enum:["cleaning","others"]
       }


    }, {
    timestamps: true
}
)

export const BookingService = mongoose.model("BookingService", bookingSchema)