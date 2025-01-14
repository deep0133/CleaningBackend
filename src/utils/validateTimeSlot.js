const validateTimeSlot = (cleanerBookings, bookingTimeSlot) => {

   console.log("--------------this is validateTimeSlot----functions-------------")

  if (cleanerBookings?.length === 0) return true;


  for (let i = 0; i < cleanerBookings.length; i++) {
    const cleanerBooking = cleanerBookings[i];
    // console.log("----------cleanerBooking one by one----------",cleanerBooking)
    

    // Calculate one hour before and after
    const oneHourBeforeTime = new Date(
      new Date(bookingTimeSlot.start).getTime() - 60*60*1000
    );



    const oneHourAfterTime = new Date(
      new Date(bookingTimeSlot.end).getTime() + 60*60*1000
    );   
   
    const endTime  = new Date(cleanerBooking.CartData[0].TimeSlot.end);
    const startTime = new Date(cleanerBooking.CartData[0].TimeSlot.start);

   
 

    if (
      !(
        endTime <= oneHourBeforeTime || startTime >= oneHourAfterTime)
    ) {
      console.log(
        "Booking cannot be accepted due to overlap with:",
        cleanerBooking
      );
      return false;
    }
  }

  return true;
};

export default validateTimeSlot;
