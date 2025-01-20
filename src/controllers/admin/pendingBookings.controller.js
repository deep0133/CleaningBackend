import { BookingService } from "../../models/Client/booking.model.js";
import {asyncHandler} from '../../utils/asyncHandler.js'
import {ApiResponse} from '../../utils/apiResponse.js'

export const pendingBookings = asyncHandler(async (req,res)=>{
    const currentTime = new Date()
    const twoHoursAgo = new Date(currentTime.getTime() - 2 * 60 * 60 * 1000);

    const bookings = await BookingService.find(
        {
        "CartData.TimeSlot.start": { $lte: twoHoursAgo }, 
        BookingStatus: "Pending", 
      }
    );
    console.log("------------------bookings--------------------")
    console.log(bookings)

  if(bookings.length===0){
    res.status(201)
    .json(new ApiResponse(201,bookings,"no bookings are Pending",true))
  }

    res.status(201)
    .json(new ApiResponse(201,bookings,"Bookings Still pending",true));

})