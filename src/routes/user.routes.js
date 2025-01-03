import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getAllContact,
  login,
  logout,
  register,
  verifyOtp,
  submitContactForm,
  updateAddress,
  myProfile,
  addNewAddress,
  allUsers,
  deleteAddress,
  verfiyOtpAndRegister,
  updateProfile,
  deleteAccount,
} from "../controllers/user/user.controller.js";
import { isAdmin, isAuthenticated } from "../middleware/authenticateUser.js";
const router = Router();

// Login, Signup Route & Logout
router.post("/register", register);
router.post("/verify", verfiyOtpAndRegister);
router.post("/login", login);

router.post("/logout", isAuthenticated, logout);

router.get("/me", isAuthenticated, myProfile);
router.get("/all", allUsers);

// Update Routes
router.post("/add/address", isAuthenticated, addNewAddress);
router.post("/update/address", isAuthenticated, updateAddress);
router.post("/update/profile", isAuthenticated, updateProfile);
router.post("/change/password", isAuthenticated, changePassword);
router.post("/deleteAddress", isAuthenticated, deleteAddress);

// Contact Us : Help & Support
router.get("/contact", isAuthenticated, getAllContact);
router.post("/contact", isAuthenticated, submitContactForm);

// Forgot Password & Reset Password
router.post("/forgot/password", forgotPassword);
router.post("/reset/password", verifyOtp);

// Delete Account
router.delete("/delete", isAuthenticated, deleteAccount);

export default router;
