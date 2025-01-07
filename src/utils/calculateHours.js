const calculateHours = (timeSlot) => {
  if (!timeSlot) return 0;
  return Math.round(
    (new Date(timeSlot.end) - new Date(timeSlot.start)) / (1000 * 60 * 60)
  ).toFixed(2);
};

export { calculateHours };
