import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Schema } from "mongoose";
import { findNearbyCleaners } from "../utils/findNearByUser.js";

 const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["client", "cleaner", "admin"],
      default: "client",
    },
    address: [
      {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
    ],
    location: {
      type: { 
        type: String, 
        enum: ['Point'],
         },  // 'type' field as Point for GeoJSON
      coordinates: {
        type: [Number],  // Longitude, Latitude
        required: true,
        validate: {
          validator: function (coords) {
            return coords.length === 2;  // Longitude and Latitude
          },
          message: "Coordinates must be an array of [longitude, latitude].",
        },
      },
    },
    // changed from this to below
    // geo: {
    //   type: {
    //     type: String, // Must always be "Point"
    //     enum: ["Point"], // Validate that type is always "Point"
    //     required: true,
    //   },
    //   coordinates: {
    //     type: [Number], // Array of numbers: [longitude, latitude]
    //     required: true,
    //     validate: {
    //       validator: function (coords) {
    //         return coords.length === 2; // Must always have two values: [longitude, latitude]
    //       },
    //       message: "Coordinates must be an array of [longitude, latitude].",
    //     },
    //   },
    // },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isOtpVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: false
    },


  },
  {
    timestamps: true,
  }
);







userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECERET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.isOtpValid = function () {
  return this.otpExpiry && this.otpExpiry > Date.now();
};

export const User = mongoose.model("User", userSchema);


// (async () => {
//   try {
//     await User.syncIndexes();
//     console.log("Indexes have been synced successfully.");
//   } catch (error) {
//     console.log("...................eeeeeeeeeeeeeeeeeeeer......................")
//     console.error("Error syncing indexes:", error);
//   }
// })();



User.collection.createIndex({ location: "2dsphere" }).
  then(() => console.log("Geospatial index created successfully.")).
  catch((err) => 
    
    console.error("Error creating geospatial index:;;;;;;;;;;;;;;;;;;;;;;;;;;;:::::::::::::", err)
);