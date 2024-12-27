import { BookingService } from "../../models/Client/booking.model.js";
import { Cart } from "../../models/Client/cart.model.js";
import AddOnModel from "../../models/Services/addons.model.js";
import ServiceModel from "../../models/Services/services.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Get Cart : Get all items in the cart
export const getAllCartItems = asyncHandler(async (req, res) => {
  const cartItems = await Cart.find({ User: req.user._id });
  const bookedCart = await BookingService.find({
    User: req.user._id,
    "CartData.TimeSlot.start": { $gt: new Date() },
  }).populate("PaymentId");

  // check paymnent status : bookedCart is array

  const upcommingBookig = bookedCart.filter(
    (item) => item.PaymentId.PaymentStatus === "paid"
  );

  res.status(200).json({
    success: true,
    cartItems: cartItems?.cart || [],
    bookedCart: upcommingBookig,
  });
});

// Add to Cart : Add a new item to the cart
export const addToCart = asyncHandler(async (req, res) => {
  const {
    categoryId, // Service ID
    timeSlot, // { start: Date, end: Date }
    userAddress,
    location, // { type: "Point", coordinates: [longitude, latitude] }
    addOns = [],
  } = req.body;

  // Validate required fields
  if (!categoryId || !timeSlot || !userAddress || !location) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (!timeSlot.start || !timeSlot.end) {
    return res.status(400).json({
      success: false,
      message: "TimeSlot must include start and end times",
    });
  }

  if (new Date(timeSlot.start) >= new Date(timeSlot.end)) {
    return res.status(400).json({
      success: false,
      message: "TimeSlot start time must be before end time",
    });
  }

  // Check if the start time is in the future
  if (new Date(timeSlot.start) <= new Date()) {
    return res.status(400).json({
      success: false,
      message: "TimeSlot start time must be in the future",
    });
  }

  // Step 2: Check if a service exists for the given category
  const service = await ServiceModel.findById(categoryId);
  if (!service) {
    return res.status(404).json({
      success: false,
      message: "Service not found",
    });
  }

  // Step 3: Calculate the total price based on the service price and add-ons
  let totalPrice = service.pricePerHour;

  // Add the price of selected add-ons
  if (addOns.length > 0) {
    // Filter the add-ons to ensure they are valid for the current service
    const validAddOnIds = service.addOns.map((addOn) => addOn.toString()); // Assuming `service.addOns` is an array of valid add-on IDs
    const invalidAddOns = addOns.filter(
      (addOnId) => !validAddOnIds.includes(addOnId)
    );

    if (invalidAddOns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some add-ons are not valid for this service: ${invalidAddOns.join(
          ", "
        )}`,
      });
    }

    // Calculate the total price for the valid add-ons
    const validAddOns = await AddOnModel.find({ _id: { $in: addOns } });
    totalPrice += validAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  }

  // Calculate duration in minutes
  const duration = Math.round(
    (new Date(timeSlot.end) - new Date(timeSlot.start)) / (1000 * 60)
  );

  try {
    // Step 4 : Check if the user already has a cart
    const existingCart = await Cart.findOne({ User: req.user._id });

    if (existingCart) {
      // Ensure the new item is not a duplicate
      const duplicateItem = await Cart.findOne({
        User: req.user._id,
        cart: {
          $elemMatch: {
            categoryId: categoryId,
            "TimeSlot.start": timeSlot.start,
            "TimeSlot.end": timeSlot.end,
            UserAddress: userAddress,
            "Location.coordinates": location.coordinates,
          },
        },
      });

      if (duplicateItem) {
        return res.status(400).json({
          success: false,
          message: "An identical cart item already exists.",
        });
      }

      // Append the new item to the cart array
      existingCart.cart.push({
        categoryId,
        TimeSlot: timeSlot,
        addOns,
        Duration: duration,
        TotalPrice: totalPrice,
        UserAddress: userAddress,
        Location: location,
      });
      // Save the updated cart
      const updatedCart = await existingCart.save();

      res.status(201).json({
        success: true,
        message: "Item added to cart successfully",
        updatedCart,
      });
    } else {
      // Create a new cart if the user does not have one
      const newCart = await Cart.create({
        User: req.user._id,
        cart: [
          {
            categoryId,
            TimeSlot: timeSlot,
            addOns,
            Duration: duration,
            TotalPrice: totalPrice,
            UserAddress: userAddress,
            Location: location,
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: "Item added to cart successfully",
        newCart,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add item to cart",
    });
  }
});

// Update Cart : cartId -->> id of subdocument in cart array
export const updateCart = asyncHandler(async (req, res) => {
  const { cartId } = req.params; // user cart id
  const { addOns, timeSlot } = req.body;

  // Find the cart item
  const cart = await Cart.findOne({
    User: req.user._id,
  });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: "Cart item not found",
    });
  }

  const cartItem = cart.cart.id(cartId);

  if (cartItem === null) {
    return res.status(404).json({
      success: false,
      message: "Cart item not found",
    });
  }

  // Validate time slot if provided
  if (timeSlot) {
    if (!timeSlot.start || !timeSlot.end) {
      return res.status(400).json({
        success: false,
        message: "TimeSlot must include start and end times",
      });
    }

    if (new Date(timeSlot.start) >= new Date(timeSlot.end)) {
      return res.status(400).json({
        success: false,
        message: "TimeSlot start time must be before end time",
      });
    }

    // Check if the start time is in the future
    if (new Date(timeSlot.start) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "TimeSlot start time must be in the future",
      });
    }

    cartItem.TimeSlot = timeSlot;
    // Recalculate duration
    cartItem.Duration = Math.round(
      (new Date(timeSlot.end) - new Date(timeSlot.start)) / (1000 * 60)
    );
  }

  // Step 2: Check if a service exists for the given category
  const service = await ServiceModel.findById(cartItem.categoryId);
  if (!service) {
    return res.status(404).json({
      success: false,
      message: "Service not found",
    });
  }

  let totalPrice = service.pricePerHour;

  // Update add-ons if provided
  if (addOns) {
    const validAddOnIds = service.addOns.map((addOn) => addOn.toString()); // Assuming `service.addOns` is an array of valid add-on IDs
    const invalidAddOns = addOns.filter(
      (addOnId) => !validAddOnIds.includes(addOnId)
    );

    if (invalidAddOns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some add-ons are not valid for this service: ${invalidAddOns.join(
          ", "
        )}`,
      });
    }

    // Calculate the total price for the valid add-ons
    const validAddOns = await AddOnModel.find({ _id: { $in: addOns } });
    totalPrice += validAddOns.reduce((sum, addOn) => sum + addOn.price, 0);

    cartItem.addOns = addOns;
    cartItem.TotalPrice = totalPrice;
  }

  // Save the updated cart item
  const updatedCart = await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart item updated successfully",
    cart: updatedCart,
  });
});

// Delete Cart : Remove a cart item from the cart array by cartId
export const deleteCart = asyncHandler(async (req, res) => {
  const { cartId } = req.params;

  // Find the cart item
  const cart = await Cart.findOne({
    User: req.user._id,
  });

  const cartItem = cart.cart.id(cartId);
  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: "Cart item not found",
    });
  }

  // Check if the user owns this cart item
  if (cart.User.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete this cart item",
    });
  }

  // Remove the cart item using the `pull` method
  cart.cart = cart.cart.filter((item) => item._id.toString() !== cartId);

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart item deleted successfully",
  });
});
