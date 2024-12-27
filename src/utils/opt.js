


import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN;  
const serviceSid = process.env.TWILIO_SERVICE_SID; 
console.log()

// Verify Service SID
const client = twilio(accountSid, authToken,{logLevel:'debug'});

// // Function to send OTP
async function sendOtp(phoneNumber) {
  try {
    const verification = await client.verify.v2.services(serviceSid)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms',
        time_to_live: 300
      });

    console.log("Verification Details:", verification);


    
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
    
    return verificationCheck;
  } catch (error) {
    // Enhanced error handling with full error message
    console.error('Error verifying OTP:', error.message);
    return (`Failed to verify OTP. ${error.message || error}`);
  }
}





export {sendOtp, verifyOtp}