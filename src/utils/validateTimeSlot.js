const validateTimeSlot = (cleanerBookings, bookingTimeSlot) => {
  console.log("---------cleanerBookings ----------", cleanerBookings);
  console.log("---------bookingTimeSlot ----------", bookingTimeSlot);
  if (cleanerBookings?.length === 0) return true;

  for (let i = 0; i < cleanerBookings.length; i++) {
    const cleanerBooking = cleanerBookings[i];

    const oneHourBeforeTime = new Date(
      3600000 - new Date(bookingTimeSlot.start)     
    );
    const oneHourAfterTime = new Date(3600000 + new Date(bookingTimeSlot.end));

    console.log(
      "---------oneHourBeforeTime of service start ----------",
      oneHourBeforeTime
    );
    console.log(
      "---------oneHourAfter_Time of service end ----------",
      oneHourAfterTime
    );
    if (
      new Date(cleanerBooking.TimeSlot.end) < new Date(oneHourBeforeTime) &&
      new Date(cleanerBooking.TimeSlot.start) > oneHourAfterTime
    ) {
      return true;
    }
  }

  return false;
};

export default validateTimeSlot;
