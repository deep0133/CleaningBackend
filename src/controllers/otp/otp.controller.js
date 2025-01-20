import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendOtp, verifyOtp } from "../../utils/opt.js";
import { User } from "../../models/user.model.js";

const otpSend = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new ApiError(401, "phoneNumber is required to send Otp");
  }

  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new ApiError(401, "user with this phone number is already exists");
  }

  user.isOtpVerified = false;
  await user.save();

  try {
    const currentStatus = await sendOtp(phoneNumber);

    if (!currentStatus) {
      throw new ApiError(401, "Failed to send OTP");
    }
  } catch (error) {
    console.error("Error sending OTP:", error.message || error);
    throw new ApiError(500, "Failed to send OTP");
  }

  res.status(200).json(new ApiResponse(200, {}, "otp sent successfully", true));
});

const otpVerification = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    throw new ApiError(401, "phoneNumber and otp is required");
  }


  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new ApiError(401, "user with this phoneNumber does not exists");
  }

  const verificationResponse = await verifyOtp(phoneNumber, otp);

  if (!verificationResponse.success) {
    throw new ApiError(401, "otp is invalid or wrong ");
  }
  user.isOtpVerified = true;
  await user.save();

  // if (context === 'forgotPassword') {

  //   const resetToken = jwt.sign(
  //     { phoneNumber },
  //     process.env.RESET_TOKEN_SECERET,
  //     {
  //       expiresIn: process.env.RESET_TOKEN_EXPIRY
  //     }
  //   );

  //   console.log("-----------resetToken-----------");
  //   console.log(resetToken)

  //   if(!resetToken){
  //     throw new ApiError(404,"server error")
  //   }

  //   return res.status(200)
  //   .json(new ApiResponse(200,{user,resetToken} , "otp is verified successfully", true));

  // }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "otp is verified successfully", true));
});

export { otpSend, otpVerification };
