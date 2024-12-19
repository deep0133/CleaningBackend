import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendOtp, verifyOtp } from "../../utils/opt.js";


const otpSend = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new ApiError(401, "phoneNumber is required to send Otp");
  }


  try {
    const currentStatus = await sendOtp(phoneNumber);

    if (!currentStatus) {
      throw new ApiError(401, "Failed to send OTP");
    }
  } catch (error) {
    console.error("Error sending OTP:", error.message || error);
    throw new ApiError(500, "Failed to send OTP");
  }


  res.status(200)
    .json(new ApiResponse(200, {}, "otp sent successfully", true))


})

const otpVerification = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber && otp) {
    throw new ApiError(401, "phoneNumber and otp is required");
  }


  const verificationResponse = await verifyOtp(phoneNumber, otp);


  if (!verificationResponse.success) {

    throw new ApiError(401, verificationResponse);
  }

  res.status(200)
    .json(new ApiResponse(200, {}, "otp is verified successfully", true));



})

export { otpSend, otpVerification };