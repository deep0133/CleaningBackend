const validateTimeSlot = (cleanerBookings, bookingTimeSlot) => {
  console.log(
    "---------bookingTimeSlot - start ----------",
    bookingTimeSlot?.start
  );
  console.log(
    "---------bookingTimeSlot - end ----------",
    bookingTimeSlot?.end
  );
  if (cleanerBookings?.length === 0) return true;

  for (let i = 0; i < cleanerBookings.length; i++) {
    const cleanerBooking = cleanerBookings[i];

    // Calculate one hour before and after
    const oneHourBeforeTime = new Date(
      new Date(bookingTimeSlot.start).getTime() - 3600000
    );

    const oneHourAfterTime = new Date(
      new Date(bookingTimeSlot.end).getTime() + 3600000
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
