import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN;  // Your Twilio Auth Token
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER; // Your Twilio phone number
const client = twilio(accountSid, authToken);

const sendOtp = async (phoneNumber) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  try {
    console.log("Sending OTP to:", phoneNumber);

    // Send SMS using Twilio Messaging API
    const message = await client.messages.create({
      body: `Your OTP is: ${otp}`, // Customize the OTP message
      from: twilioPhoneNumber,     // Your Twilio phone number
      to: phoneNumber,             // Recipient's phone number
    });

    console.log("OTP sent successfully. Message SID:", message.sid);
    return {
      success: true,
      message: "OTP sent successfully",
      sid: message.sid,
    };
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return {
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    };
  }
};

export { sendOtp };




