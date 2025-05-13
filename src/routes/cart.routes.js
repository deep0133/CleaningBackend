import { Router } from "express";
import { isAuthenticated } from "../middleware/authenticateUser.js";
import {
  addToCart,
  deleteCart,
  getAllCartItems,
  updateCart,
} from "../controllers/cart/cartController.js";
const router = Router();

// get all cart items
router.get("/", isAuthenticated, getAllCartItems);

// add to cart
router.post("/add", isAuthenticated, addToCart);

// update cart
router.put("/update/:cartId", isAuthenticated, updateCart);

router.delete("/remove/:cartId", isAuthenticated, deleteCart);
export default router;
