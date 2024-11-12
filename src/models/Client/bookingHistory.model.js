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
        ref:"BookingClient",
        required:true
    },
    serviceMan:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"ServiceMan",
        required:true
    },
    BookingStatus:{
       type:String,
       enum:["completed","canceled","Pending"]
    }
},
{
    timestamps:true
}
)

export const BookingHistory = mongoose.model("BookingHistory",bookingHistorySchema);