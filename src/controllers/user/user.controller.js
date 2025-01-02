import { User } from "../../models/user.model.js";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { Contact } from "../../models/contactSchema.js";
import { sendOtp, verifyOtp } from "../../utils/opt.js";
import jwt from "jsonwebtoken";

const verifyOtpController = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phoneNumber,
    password,
    role,
    address,
    category,
    otp,
    location,
    availability,
    currentBooking,
    rating,
    totalBookings,
    completedBookings,
    earnings,
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
    throw new ApiError(401, verificationResponse, "OTP verification failed");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  // If additional registration details are provided

  // Create a new user with full details
  try {
    const user = await User.create(
      [
        {
          name,
          email,
          password,
          role,
          address,
          phoneNumber,
          isVerified: true,
        },
      ],
      { session }
    );

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
            location,
            availability,
            currentBooking,
            rating,
            totalBookings,
            completedBookings,
            earnings,
            isOnline,
          },
        ],
        { session }
      );

      if (!cleaner || cleaner.length === 0) {
        throw new ApiError(500, "Failed to create cleaner record");
      }
    }

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
          " otp is verfied and User registered successfully"
        )
      );
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    throw error;
  } finally {
    session.endSession();
  }
});

// const register = asyncHandler(async (req, res) => {
//   // take name email password , address , role ,phone number from the user
//   //check validations
//   // check user already exists or not
//   // before saving hash the password
//   // generate access and refresh token also
//   //create user object to save data in db
//   // check user created or not
//   // send response
//   const { name, email, phoneNumber, password, role, address, category } =
//   req.body;

//     // let status = null;
//     // if (phoneNumber) {
//     //   try {
//     //     status = await sendOtp(phoneNumber);
//     //     console.log("OTP Request Response:", status);

//     //     if (!status.success) {
//     //       throw new ApiError(401, status.message || "Sending OTP failed");
//     //     }
//     //   } catch (error) {
//     //     console.error("Error sending OTP:", error.message || error);
//     //     throw new ApiError(500, "Failed to send OTP");
//     //   }
//     // }

//   if (
//     [name, email, password, role, phoneNumber].some(
//       (field) => typeof field !== "string" || field.trim() === ""
//     ) ||
//     !Array.isArray(address) ||
//     address.length === 0
//   ) {
//     throw new ApiError(400, "All fields are required");
//   }

//   const existedUser = await User.findOne({
//     $or: [{ phoneNumber }, { email }],
//   });

//   if (existedUser) {
//     throw new ApiError(409, "User with this  email  already exists");
//   }
//   if (
//     role === "cleaner" && category===""
//   ) {
//     throw new ApiError(400, "Category field is required for cleaners");
//   }

//   const user = await User.create({
//     name,
//     email,
//     password,
//     role,
//     address,
//     phoneNumber,
//   });

//   if (role === "cleaner") {
//     await Cleaner.create({
//       user: user._id,
//       category,
//     });
//   }

//   const accessToken = user.generateAccessToken();
//   const refreshToken = user.generateRefreshToken();

//   user.accessToken = accessToken;
//   user.refreshToken = refreshToken;

//   await user.save({ validateBeforeSave: false });

//   const createdUser = await User.findById(user._id).select(
//     "-password -refreshToken"
//   );

//   if (!createdUser) {
//     throw new ApiError(500, "Something went wrong while registering the user");
//   }

//   res.status(200).json(
//     new ApiResponse(
//       200,
//       {
//         createdUser,
//         accessToken,
//         refreshToken,

//       },
//       "user registered successfully"
//     )
//   );
// });

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

      if (!currentStatus) {
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

const login = asyncHandler(async (req, res) => {
  // take number and password from the user
  // send otp to the user at his number and save the otp to the database
  // take otp from the user  and validate it from the database

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

  res.set("Authorization", `Bearer ${accessToken}`);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken,
        refreshToken,
      },
      "user logged in successfully"
    )
  );
});

const logout = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    throw new ApiError(400, "token is required");
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECERET);

  const user = await User.findById(decoded._id);

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
  const messages = await Contact.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.status(200).json(messages);
});

// Enter Phone Number To Recieve OTP for reset password
const forgotPassword = asyncHandler(async (req, res) => {
  const { newPassword, phoneNumber } = req.body;

  if (!newPassword || !phoneNumber) {
    throw new ApiError(400, "pasword or phoneNumber is missing");
  }

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
  console.log(process.env.ACCESS_TOKEN_SECERET);
  if (!token) {
    throw new ApiError(400, "token is required");
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECERET);

  console.log(decoded);
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

export {
  myProfile,
  allUsers,
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
  verifyOtpController,
  deleteAddress,
};

// get all users:
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  res.status(200).json({ success: true, users });
});
