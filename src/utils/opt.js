


import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN;  
const serviceSid = process.env.TWILIO_SERVICE_SID; 

// Verify Service SID
const client = twilio(accountSid, authToken);

// Function to send OTP
async function sendOtp(phoneNumber) {
  try {
    const verification = await client.verify.v2.services(serviceSid)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms',
      });

    console.log("Verification Details:", verification);


    if (verification.status === 'canceled') {
      return {
        success: false,
        message: `Failed to send OTP. Status: ${verification.status}`,
      };
    } else if (verification.status === 'approved') {
      return {
        success: true,
        message: "OTP sent and already approved.",
      };
    } else if (verification.status === 'pending') {
      
            
    } else {
      return {
        success: false,
        message: `Unexpected status: ${verification.status}`,
      };
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: `Error sending OTP: ${error.message || "Unknown error"}`,
    };
  }
}








// Function to verify OTP
async function verifyOtp(phoneNumber, otpCode) {
  try {
    // Ensure serviceSid is correctly passed
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
  } catch (error) {
    // Enhanced error handling with full error message
    console.error('Error verifying OTP:', error);
    throw new Error(`Failed to verify OTP. ${error.message || error}`);
  }
}





export {sendOtp, verifyOtp}