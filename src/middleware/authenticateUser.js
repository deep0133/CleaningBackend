import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
const SECRET_KEY = process.env.ACCESS_TOKEN_SECERET;

function isAuthenticated(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      message: "No Authorization Header====",
    });
  }

  try {
    const token = authorization.startsWith("Bearer ")
      ? authorization.split("Bearer ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        message: "Invalid Token Format",
      });
    }
    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Token Expired",
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Invalid Token",
      });
    }
    // Catch any unexpected errors
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

async function isCleaner(req, res, next) {
  const user = await User.findById(req.user._id).select(
    "-password -isOtpVerified -accessToken -refreshToken"
  );
  req.cleaner_data_in_user = user;
  if (!user || user.role !== "cleaner") {
    return res.status(403).json({
      message: "You are not authorized to perform this action",
    });
  }
  next();
}

// Middleware to authenticate admin users
async function isAdmin(req, res, next) {
  const user = await User.findById(req.user._id).select("role");
  if (!user || user.role !== "admin") {
    return res.status(403).json({
      message: "You are not authorized to perform this action",
    });
  }
  next();
}

export { isAdmin, isCleaner, isAuthenticated };
