import mongoose from "mongoose";
import { BookingClient } from "../Client/booking.client";
import { required } from "nodemon/lib/config";

const requestSchema = mongoose.Schema({
    BookingClient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
    },
    serviceMan:{
         type:mongoose.Schema.Types.ObjectId,
         ref:"serviceMan",
        
    },
    requestStatus: {
        type: String,
        enum: ["accept", "reject", "pending"],
        required: true,
        default:'pending'
    }
}, {
    timestamps: true
})

export const ClientRequest = mongoose.model("ClientRequest", requestSchema)