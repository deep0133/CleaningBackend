


import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN;  
const serviceSid = process.env.TWILIO_SERVICE_SID; 
console.log()

// Verify Service SID
const client = twilio(accountSid, authToken);

// // Function to send OTP
async function sendOtp(phoneNumber) {
  try {
    const verification = await client.verify.v2.services(serviceSid)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms',
        ttl:300
      });

    console.log("Verification Details:", verification);


    // if (verification.status === 'canceled') {
    //   return {
   
    //     message: `Failed to send OTP. Status: ${verification.valid}`,
    //   };
    // } else if (verification.status === 'approved') {
    //   return {
           
    //     message: "OTP sent and already approved.",
    //   };
    // } else if (verification.status === 'pending') {
      
    //         message:`pendingStatus${verification.valid}`
    // } else {
    //   return {
    //     success: false,
    //     message: `Unexpected status: ${verification.status}`,
    //   };
    // }
    if(verification.status==='pending'){
      return ({
        success:true,
        message:"otp sent successfully"
      })
    }else{
      return ({
        message:"failed to send Otp",
        success:false
      })
    }
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    return {
      
      message: `Error sending OTP: ${error.message || "Unknown error"}`,
    };
  }
}


// async function sendOtp(phoneNumber) {
//   const pollInterval = 2000; // 2 seconds interval between checks
//   const maxRetries = 15; // Maximum retries (e.g., 15 retries = 30 seconds max wait)

//   try {
//     // Trigger the OTP sending process
//     const verification = await client.verify.v2.services(serviceSid)
//       .verifications
//       .create({
//         to: phoneNumber,
//         channel: 'sms',
//       });

//     console.log("Initial Verification Details:", verification);

//     if (verification.status === 'canceled') {
//       return {
//         message: `Failed to send OTP. Status: ${verification.status}`,
//       };
//     }

//     let retries = 0;
//     let currentStatus = verification.status;

//     // Polling loop to check the verification status
//     while (currentStatus !== 'approved' && retries < maxRetries) {
//       await new Promise((resolve) => setTimeout(resolve, pollInterval)); // Wait for the interval

//       // Fetch the current verification status
//       const updatedVerification = await client.verify.v2.services(serviceSid)
//         .verificationChecks
//         .create({ to: phoneNumber, code: 'dummy' }); // Replace 'dummy' if specific checks require a code

//       currentStatus = updatedVerification.status;
//       console.log(`Current Status Check ${retries + 1}:`, currentStatus);

//       if (currentStatus === 'canceled') {
//         return {
//           message: `OTP process was canceled.`,
//         };
//       }

//       retries++;
//     }

//     if (currentStatus === 'approved') {
//       return {
//         success: true,
//         message: "OTP sent and approved.",
//       };
//     } else {
//       return {
//         success: false,
//         message: "OTP approval timed out.",
//       };
//     }
//   } catch (error) {
//     console.error('Error sending OTP:', error.message);
//     return {
//       message: `Error sending OTP: ${error.message || "Unknown error"}`,
//     };
//   }
// }









// Function to verify OTP
async function verifyOtp(phoneNumber, otpCode) {
  try {
    console.log("hello world how are you")
    console.log(`Service SID: ${serviceSid}`);
    
    // API call for verification check
    const verificationCheck = await client.verify.v2.services(serviceSid)
      .verificationChecks
      .create({
        to: phoneNumber,
        code: otpCode,
      });

 

    // Check if verification was successful
    if (verificationCheck.status === 'approved') {
      console.log(`Verification Check Response:`, verificationCheck);
      return {
        success: true,
        message: "OTP verification succeeded",
      };
    } else {
      return {
        success: false,
        message: "OTP verification failed",
      };
    }
    console.log("......................./................",verificationCheck)
    return verificationCheck;
  } catch (error) {
    // Enhanced error handling with full error message
    console.error('Error verifying OTP:', error.message);
    return (`Failed to verify OTP. ${error.message || error}`);
  }
}





export {sendOtp, verifyOtp}