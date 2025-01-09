import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { User } from "../../models/user.model.js";
import mongoose from "mongoose";
import AccountDetail from "../../models/accountDetail/accountDetail.model.js";
import { Cleaner } from "../../models/Cleaner/cleaner.model.js";
export const updateProfile = asyncHandler(async (req, res) => {
  const _id = req.user.id;
  const { name, phoneNumber, email } = req.body;

  const user = await User.findById({ _id });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (name) user.name = name;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (email) user.email = email;

  await user.save();

  const updatedUser = await user
    .findById({ _id })
    .select("-password -refershToken -accessToken");

  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "user Updated successfully", true));
});

export const updatedAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { address } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  user.address = address;

  const updatedUser = await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        "user Address updated successfully",
        true
      )
    );
});

export const updateStatus = asyncHandler(async (req, res) => {
  const _id = req.user.id;
  const user = await User.findById({ _id });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isActive = false;
  const updatedUser = await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, userStatus, "user is blocked", true));
});

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

  console.log();

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

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email && !password) {
    return res.status(404).json({
      success: false,
      message: "Invalid Credentials",
    });
  }
  const admin = await User.findOne({ email: email });

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Invalid Credentials",
    });
  }

  if (admin?.role !== "admin") {
    return res.status(404).json({
      success: false,
      message: "Invalid Credentials",
    });
  }

  const isPasswordValid = await admin.isPasswordCorrect(password);

  if (!isPasswordValid === false) {
    return res.status(404).json({
      success: false,
      message: "Invalid Credentials",
    });
  }

  const accessToken = await admin.generateAccessToken();
  const refreshToken = await admin.generateRefreshToken();
  res.status(200).json({
    success: true,
    message: "Login Successfull",
    accessToken,
    refreshToken,
  });
});
