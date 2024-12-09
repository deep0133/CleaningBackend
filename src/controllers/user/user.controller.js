import { User } from "../../models/user.model.js";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { Contact } from "../../models/contactSchema.js";
import twilio from "twilio"; // Twilio for SMS

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// const client = twilio(accountSid, authToken);

const register = asyncHandler(async (req, res) => {
  // take name email password , address , role ,phone number from the user
  //check validations
  // check user already exists or not
  // before saving hash the password
  // generate access and refresh token also
  //create user object to save data in db
  // check user created or not
  // send response
  const { name, email, phoneNumber, password, role, address, category } =
    req.body;
  console.log(req.body);

  if (
    [name, email, password, role, phoneNumber].some(
      (field) => typeof field !== "string" || field.trim() === ""
    ) ||
    !Array.isArray(address) ||
    address.length === 0
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ phoneNumber }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with this  email  already exists");
  }
  if (
    role === "cleaner" &&
    (!Array.isArray(category) || category.length === 0)
  ) {
    throw new ApiError(400, "Category field is required for cleaners");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    address,
    phoneNumber,
  });

  if (role === "cleaner") {
    await Cleaner.create({
      user: user._id, // Reference to the User
      category,
    });
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.accessToken = accessToken;
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  if (!Array.isArray(category) || category.length === 0) {
    throw new ApiError(400, "Category is required for serviceMan");
  }

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        createdUser,
        accessToken,
        refreshToken,
      },
      "user registered successfully"
    )
  );
});

const login = asyncHandler(async (req, res) => {
  // take number and password from the user
  // send otp to the user at his number and save the otp to the database
  // take otp from the user  and validate it from the database

  const { phoneNumber, password } = req.body;

  if (!phoneNumber) {
    throw new ApiError(400, "email or phone number is required");
  }
  // check if the user exists or not

  const user = await User.findOne({
    $or: [{ phoneNumber: phoneNumber }],
  });

  if (!user) {
    throw new ApiError(401, "user does not exist");
  }

  if (!password) {
    throw new ApiError(401, "password is required");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  user.accessToken = accessToken;
  user.refreshToken = refreshToken;

  const loggingInfo = await User.findById(user._id).select("-password ");

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: loggingInfo,
        accessToken,
        refreshToken,
      },
      "user info is correct do further verification"
    )
  );
});

const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Clear the refresh token
  user.accessToken = null;
  user.refreshToken = null;
  await user.save();

  // Respond with a success message
  res.json(new ApiResponse(200, {}, "User logged out successfully"));
});
const myProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber, address } = req.body;

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (email) user.email = email;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (address) user.address = address;

  await user.save();

  res.status(200).json({ success: true, message: "Profile Updated" });
});

const updateAddress = asyncHandler(async (req, res) => {
  const { address, addressId } = req.body;

  // Find the user by their ID
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!address && !addressId) {
    return res.status(400).json({
      success: false,
      message: "Provide either a new address or an addressId to update",
    });
  }

  // Update address if `addressId` is provided
  if (addressId) {
    const addressIndex = user.address.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address with the given ID not found",
      });
    }

    // Update the existing address
    user.address[addressIndex] = address;
  } else if (address) {
    // Push a new address if `addressId` is not provided
    user.address.push(address);
  }

  // Save the updated user
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Address updated successfully" });
});

const addNewAddress = asyncHandler(async (req, res) => {
  const { address } = req.body;

  const user = await User.findById(req.user._id);

  if (address) user.address.push(address);

  await user.save();

  res.status(200).json({ success: true, message: "Address Updated" });
});

const changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return next(new ApiError(400, "Provide Old And New Password"));

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.matchPassword(oldPassword);

  if (!isMatch) return next(new ApiError(200, "Incorrect Old Password"));

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: "Password Updated" });
});

const submitContactForm = asyncHandler(async (req, res, next) => {
  const { fullName, email, mobileNumber, message } = req.body;

  // Validate required fields
  if (!fullName || !email || !mobileNumber || !message) {
    throw new ApiError(400, "All fields are required");
  }

  const newContact = new Contact({
    userId: req.user._id, // Attach user ID if authenticated
    fullName,
    email,
    mobileNumber,
    message,
  });

  await newContact.save();
  res.status(201).json({ message: "Message submitted successfully" });
});

const getAllContact = asyncHandler(async (req, res) => {
  const messages = await Contact.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.status(200).json(messages);
});

// Enter Phone Number To Recieve OTP for reset password
const forgotPassword = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    // Find user by phone number
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this phone number not found" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP and expiry (5 minutes from now)
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await user.save();

    // Send OTP via SMS using Twilio
    // await client.messages.create({
    //   body: `Your OTP for password reset is: ${otp}`,
    //   from: twilioPhone,
    //   to: phoneNumber,
    // });

    res
      .status(200)
      .json({ message: "OTP sent successfully to your mobile number" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Verify OTP -- of User:
const verifyOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  // Find user by email
  const user = await User.findOne({ phoneNumber });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if OTP matches
  if (user.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Check if OTP has expired
  if (new Date() > user.otpExpiry) {
    return res.status(400).json({ message: "OTP has expired" });
  }

  // Clear OTP and expiry
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  // OTP verified successfully
  res.status(200).json({ message: "OTP verified successfully" });
});

// Reset Password --- by JWT TOken --- this will only use when we send token through jwt.
const resetPassowrd = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;

  // Verify token
  const decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET);

  // Find user
  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(404).json({ error: "Invalid or expired token" });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({ message: "Password reset successful" });
});

export {
  myProfile,
  register,
  login,
  logout,
  updateAddress,
  addNewAddress,
  changePassword,
  submitContactForm,
  getAllContact,
  forgotPassword,
  verifyOtp,
  resetPassowrd,
};
