import jwt from "jsonwebtoken";
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

function isCleaner(req, res, next) {
  if (!req.user || req.user.role !== "cleaner") {
    return res.status(403).json({
      message: "You are not authorized to perform this action",
    });
  }
  next();
}

// Middleware to authenticate admin users
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "You are not authorized to perform this action",
    });
  }
  next();
}

export { isAdmin, isCleaner, isAuthenticated };
