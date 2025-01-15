export const convertISTtoUTC = (istDate) => {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const utcDate = new Date(new Date(istDate).getTime() - istOffset);
    return utcDate.toISOString(); // Return in ISO format
  };

  // universal time 

  export const convertUTCtoIST = (utcDate) => {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const istDate = new Date(new Date(utcDate).getTime() + istOffset);
    return istDate.toISOString(); // Return in ISO format
  };

  // indian standard time