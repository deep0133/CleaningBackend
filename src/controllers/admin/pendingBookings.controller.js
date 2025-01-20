import { BookingService } from "../../models/Client/booking.model.js";
import {asyncHandler} from '../../utils/asyncHandler.js'
import {apiResponse} from '../../utils/apiResponse.js'
import {apiError} from '../../utils/apiError.js'
export const pendingBookings = asyncHandler(async (req,res)=>{
    const currentTime = new Date()
    const twoHoursAgo = new Date(currentTime.getTime() - 2 * 60 * 60 * 1000);

    const bookings = await BookingService.find(
        {
        "CartData.TimeSlot.start": { $lte: twoHoursAgo }, 
        BookingStatus: "Pending", 
      }
    );

    if(!bookings){
        res.status(201)
        .json(new apiResponse(201,{},"no pending Bookings",true))
    }

    res.status(201)
    .json(new apiResponse(201,bookings,"Bookings Still pending",true));

})