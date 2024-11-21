import mongoose, { mongo } from "mongoose";
import { required } from "nodemon/lib/config";

const bookingHistorySchema = mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    Bookings:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Booking",
        required:true
    },
    serviceMan:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"ServiceMan",
        required:false
    },
    BookingStatus:{
       type:String,
       enum:["completed","canceled","Pending"],
       default:"pending"
    }
},
{
    timestamps:true
}
)

export const BookingHistory = mongoose.model("BookingHistory",bookingHistorySchema);