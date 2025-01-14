import { User } from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { Contact } from "../../models/contactSchema.js";
import { sendOtp, verifyOtp } from "../../utils/opt.js";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import AccountDetail from "../../models/accountDetail/accountDetail.model.js";
import { v2 as cloudinary } from "cloudinary";

const verfiyOtpAndRegister = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phoneNumber,
    password,
    role,
    address,
    category,
    otp,
    availability,
    isOnline,
  } = req.body;

  if (!phoneNumber || !otp) {
    throw new ApiError(400, "Phone number and OTP are required");
  }

  if (
    [name, email, password, role, phoneNumber].some(
      (field) => typeof field !== "string" || field.trim() === ""
    ) ||
    !Array.isArray(address) ||
    address.length === 0
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check for existing user by email or phone number
  const existedUser = await User.findOne({ $or: [{ phoneNumber }, { email }] });
  if (existedUser) {
    throw new ApiError(
      409,
      "User with this email or phoneNumber already exists"
    );
  }

  if (role === "cleaner" && !category) {
    throw new ApiError(400, "Category field is required for cleaners");
  }

  // Verify OTP
  const verificationResponse = await verifyOtp(phoneNumber, otp);

  if (!verificationResponse || verificationResponse.success === false) {
    // throw new ApiError(401, verificationResponse, "OTP verification failed");
    return res
      .status(401)
      .json(new ApiResponse(401, {}, "OTP verification failed"));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create a new user with full details
    const user = new User({
      name,
      email,
      password,
      role,
      address,
      phoneNumber,
      isVerified: true,
    });

    await user.save({ session });

    // Create associated Cleaner record if role is cleaner
    if (role === "cleaner") {
      if (!user._id) {
        throw new ApiError(
          500,
          "Something went wrong while registering the user"
        );
      }
      const cleaner = await Cleaner.create(
        [
          {
            user: user._id,
            category,
            availability,
            earning: 0,
            isOnline,
          },
        ],
        { session }
      );

      if (!cleaner || cleaner.length === 0) {
        throw new ApiError(500, "Failed to create cleaner record");
      }
    }

    // Commit the transaction if everything went well
    await session.commitTransaction();

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -accessToken"
    );
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "OTP is verified and User registered successfully"
        )
      );
  } catch (error) {
    // If error happens, rollback the transaction and log the error
    console.error("Transaction error:", error);

    // Only abort if we haven't committed the transaction
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    // Throw the error to propagate
    throw error;
  } finally {
    // End the session in either case (commit or abort)
    session.endSession();
  }
});

const register = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new ApiError(401, "Invalid phone number");
  }

  const user = await User.findOne({ phoneNumber });

  if (user) {
    throw new ApiError(401, "User with this number already exists");
  }

  if (phoneNumber) {
    try {
      const currentStatus = await sendOtp(phoneNumber);

      if (!currentStatus || currentStatus.success === false) {
        throw new ApiError(401, "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error.message || error);
      throw new ApiError(500, "Failed to send OTP");
    }
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "OTP sent successfully Do OTP verification",
        true
      )
    );
});

// take number and password from the user
// send otp to the user at his number and save the otp to the database
// take otp from the user  and validate it from the database
const login = asyncHandler(async (req, res) => {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber && !password) {
    throw new ApiError(400, "password or phone number is required");
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
        accessToken,
        refreshToken,
        role: loggingInfo.role,
      },
      "user logged in successfully"
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
  const user = await User.findById(req.user._id).select(
    "-password -accessToken -refreshToken -location "
  );

  res.status(200).json({ success: true, user });
});

const allUsers = asyncHandler(async (req, res) => {
  const user = await User.find();
  res.status(200).json({ success: true, user });
});

const updateProfile = asyncHandler(async (req, res) => {
  // -----Pending--- : Remove phone number -- it is not verified
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
    userId: req.user._id,
    fullName,
    email,
    mobileNumber,
    message,
  });

  await newContact.save();
  res.status(201).json({ message: "Message submitted successfully" });
});

const getAllContact = asyncHandler(async (req, res) => {
  const messages = await Contact.find().populate("userId", "name email");
  res.status(200).json({ success: true, data: messages });
});

// Enter Phone Number To Recieve OTP for reset password
const forgotPassword = asyncHandler(async (req, res) => {
  const { newPassword, phoneNumber } = req.body;
  // const resetToken =  req.headers['authorization']?.split(' ')[1];

  // console.log("----------------resetToken------------");
  //   console.log(resetToken);
  // if(!resetToken){
  //   throw new ApiError(404,"Token is missing")
  // }

  if (!newPassword) {
    throw new ApiError(400, "newPassword is missing");
  }

  // const decodedToken = jwt.verify(resetToken, process.env.RESET_TOKEN_SECERET);
  // if(!decodedToken){
  //   throw new ApiError(400,"Invalid or expired Token")
  // }

  // console.log("--------------decodedToken---------------");
  // console.log(decodedToken);

  // const {phoneNumber} = decodedToken;
  // console.log("----------------------- Decoded----PhoneNumber-------")
  // console.log(phoneNumber);

  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new ApiError(400, "user with this number does not exists");
  }

  if (!user.isOtpVerified) {
    throw new ApiError(400, "user is not verified ");
  }

  user.password = newPassword;
  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password is updated successfully"));
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

const deleteAddress = asyncHandler(async (req, res) => {
  const { index, token } = req.body;
  if (!token) {
    throw new ApiError(400, "token is required");
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECERET);

  const id = decoded._id;

  const user = await User.findById(id);
  user.address.splice(index, 1);
  await user.save();

  if (!user) {
    throw new ApiError(400, "user does not exists");
  }

  if (
    index === undefined ||
    typeof index !== "number" ||
    index < 0 ||
    index >= user.address.length
  ) {
    throw new ApiError(
      400,
      "Index should be a valid integer within the range of the addresses array."
    );
  }

  user.address.splice(index, 1);
  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, {}, "address is removed successfully", true));
});

const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user || user?.isDeleted) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  user.isDeleted = true;

  await user.save();

  res.status(200).json(new ApiResponse(200, {}, "Account is deleted"));
});

export {
  myProfile,
  allUsers,
  register,
  login,
  logout,
  updateAddress,
  addNewAddress,
  updateProfile,
  changePassword,
  submitContactForm,
  getAllContact,
  forgotPassword,
  verifyOtp,
  resetPassowrd,
  verfiyOtpAndRegister,
  deleteAddress,
  deleteAccount,
};

export const createdByAdmin = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phoneNumber,
    password,
    role,
    address,
    category,
    status,
    accountNumber,
    accountName,
    bankName,
    accountType,
  } = req.body;

  if (role !== "client" && role !== "cleaner") {
    throw new ApiError(400, "User and Cleaner can create Account from here");
  }

  if (!phoneNumber) {
    throw new ApiError(400, "Phone number is required");
  }

  if (
    [name, email, password, role, phoneNumber].some(
      (field) => typeof field !== "string" || field.trim() === ""
    ) ||
    !Array.isArray(address) ||
    address.length === 0
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check for existing user by email or phone number
  const existedUser = await User.findOne({ $or: [{ phoneNumber }, { email }] });
  if (existedUser) {
    throw new ApiError(
      409,
      "User with this email or phoneNumber already exists"
    );
  }

  if (role === "cleaner" && !category) {
    throw new ApiError(400, "Category field is required for cleaners");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create a new user with full details
    const user = new User({
      name,
      email,
      password,
      role,
      address,
      phoneNumber,
      isVerified: true,
      isOtpVerified: true,
      isActive: status,
    });

    await user.save({ session });

    // Create associated Cleaner record if role is cleaner
    if (role === "cleaner") {
      if (!user._id) {
        throw new ApiError(
          500,
          "Something went wrong while registering the user"
        );
      }

      let bankDetails = null;
      // Bank Detail adding
      if (accountNumber && accountName && bankName && accountType) {
        bankDetails = await AccountDetail.create(
          [
            {
              accountNumber,
              accountName,
              bankName,
              accountType,
            },
          ],
          { session }
        );
        if (!bankDetails) {
          throw new ApiError(500, "Failed to create bank details");
        }
      } else {
        throw new ApiError(400, "AccountDetail are required for cleaners");
      }

      const cleaner = await Cleaner.create(
        [
          {
            user: user._id,
            category,
            accountId: bankDetails[0]._id,
          },
        ],
        { session }
      );

      if (!cleaner || cleaner.length === 0) {
        throw new ApiError(500, "Failed to create cleaner record");
      }
    }

    // Commit the transaction if everything went well
    await session.commitTransaction();

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -accessToken"
    );
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { message: "Account Created" }));
  } catch (error) {
    // If error happens, rollback the transaction and log the error
    console.error("Transaction error:", error);

    // Only abort if we haven't committed the transaction
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    // Throw the error to propagate
    throw error;
  } finally {
    // End the session in either case (commit or abort)
    session.endSession();
  }
});

const updateProfilePhoto = asyncHandler(async (req, res) => {
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

// multerUpload.single("profilePhoto")
export const updatePhoto = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  // Check if a file was uploaded
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Get the Cloudinary URL from multer
  const profilePhotoUrl = req.file.path;

  // Find the user in the database
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Check if the user already has a profile photo and delete it from Cloudinary
  if (user.profilePhoto) {
    const publicId = user.profilePhoto.split("/").pop().split(".")[0]; // Extract public ID from the URL
    await cloudinary.uploader.destroy(`uploads/${publicId}`);
  }

  user.profilePhoto = profilePhotoUrl;

  await user.save();

  res.status(200).json({
    message: "Profile photo updated successfully",
    data: user,
  });
});
