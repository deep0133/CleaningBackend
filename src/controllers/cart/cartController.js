import { BookingService } from "../../models/Client/booking.model.js";
import { Cart } from "../../models/Client/cart.model.js";
import AddOnModel from "../../models/Services/addons.model.js";
import ServiceModel from "../../models/Services/services.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { calculateHours } from "../../utils/calculateHours.js";

export const getAllCartItems = asyncHandler(async (req, res) => {
  let cartItems = await Cart.findOne({ User: req.user._id });

  if (!cartItems) {
    return res.status(200).json({
      success: true,
      cartItems,
    });
  }

  if (cartItems.cart.length === 0) {
    return res.status(200).json({
      success: true,
      cartItems,
    });
  }

  let updatedCartItems = {
    ...cartItems.toObject(),
    cart: cartItems.cart.map((item) => ({
      ...item.toObject(),
      categoryId: item.categoryId.name,
    })),
  };

  console.table(JSON.stringify(cartItems));

  res.status(200).json({
    success: true,
    cartItems: updatedCartItems,
  });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { categoryId, timeSlot, userAddress, location, addOns } = req.body;

  if (!categoryId || !timeSlot || !userAddress || !location) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (!addOns) {
    return res.status(400).json({
      success: false,
      message: "Add-ons is required",
    });
  }

  if (!timeSlot.start || !timeSlot.end) {
    return res.status(400).json({
      success: false,
      message: "TimeSlot must include start and end times",
    });
  }

  console.log(
    "--------step 1 --- incomming time slot---------------",
    timeSlot
  );

  if (new Date(timeSlot.start) >= new Date(timeSlot.end)) {
    return res.status(400).json({
      success: false,
      message: "TimeSlot start time must be before end time",
    });
  }

  if (new Date(timeSlot.start) <= new Date()) {
    return res.status(400).json({
      success: false,
      message: "TimeSlot start time must be in the future",
    });
  }

  const service = await ServiceModel.findById(categoryId);
  if (!service) {
    return res.status(404).json({
      success: false,
      message: "Service not found",
    });
  }

  // let totalPrice = service.pricePerHour;
  let totalPrice = 0;

  const validAddOnId = service?.addOns?.find(
    (addOn) => addOn.toString() === addOns.toString()
  );

  console.log("--------step 2 --- addOns checking---------------");
  if (!validAddOnId) {
    return res.status(400).json({
      success: false,
      message: `Add-ons are not valid for this service: ${validAddOnId}`,
    });
  }

  const validAddOns = await AddOnModel.findOne({ _id: addOns });

  if (!validAddOns) {
    return res.status(400).json({
      success: false,
      message: `Addons not present in Addons collection: ${validAddOnId}`,
    });
  }

  // calculate hours:
  const durationInHours = calculateHours(timeSlot);

  totalPrice += validAddOns.price * durationInHours;

  const existingCart = await Cart.findOne({ User: req.user._id });

  // if user already have any item in cart then make them to complete payment then try again to book other service OR remove item from cart
  if (existingCart) {
    if (existingCart?.cart?.length > 0) {
      console.log("----cart found-------------");
      res.status(201).json({
        success: true,
        message: "Complete payment of cart item first or remove item from cart",
      });
    } else {
      console.log(
        "----------step 4 existingCart cart - timeSlot in else block --------:",
        timeSlot
      );
      existingCart.cart.push({
        categoryId,
        TimeSlot: timeSlot,
        addOns,
        Duration: durationInHours,
        TotalPrice: totalPrice,
        UserAddress: userAddress,
        Location: location,
      });
      await existingCart.save();

      return res.status(200).json({
        success: true,
        message: "Item added to cart successfully",
        newCart: existingCart,
      });
    }
  } else {
    console.log(
      "----------step 4 existingCart cart - timeSlot in else block --------:",
      timeSlot
    );
    const newCart = new Cart({
      User: req.user._id,
      cart: [
        {
          categoryId,
          TimeSlot: timeSlot,
          addOns,
          Duration: durationInHours,
          TotalPrice: totalPrice,
          UserAddress: userAddress,
          Location: location,
        },
      ],
    });

    await newCart.save();

    console.log("----step 5 cart added -------------", newCart);
    res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      newCart,
    });
  }
});

export const updateCart = asyncHandler(async (req, res) => {
  const { cartId } = req.params;
  const { addOns, timeSlot } = req.body;

  const cart = await Cart.findOne({
    User: req.user._id,
  });

  console.log(cart);
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

    if (new Date(timeSlot.start) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "TimeSlot start time must be in the future",
      });
    }

    cartItem.TimeSlot = timeSlot;

    cartItem.Duration = calculateHours(timeSlot);
  }

  const service = await ServiceModel.findById(cartItem.categoryId);
  if (!service) {
    return res.status(404).json({
      success: false,
      message: "Service not found",
    });
  }

  // let totalPrice = service.pricePerHour;
  let totalPrice = 0;

  if (addOns) {
    const validAddOnIds = service.addOns.find(
      (addOn) => addOn.toString() === addOns.toString()
    );

    if (!validAddOnIds) {
      return res.status(400).json({
        success: false,
        message: `Some add-ons are not valid for this service: ${validAddOnIds}`,
      });
    }

    const validAddOns = await AddOnModel.findOne({ _id: addOns });
    totalPrice += validAddOns.price * cartItem.Duration;

    cartItem.addOns = addOns;
    cartItem.TotalPrice = totalPrice;
  }

  const updatedCart = await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart item updated successfully",
    cart: updatedCart,
  });
});

export const deleteCart = asyncHandler(async (req, res) => {
  const { cartId } = req.params;

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

  if (cart.User.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete this cart item",
    });
  }

  const removableStatuses = [
    "amount_capturable",
    "canceled",
    "created",
    "partially_funded",
    "failed",
    "processing",
  ];

  // Find the booking
  const booking = await BookingService.findOne({
    User: req.user._id,
    "CartData._id": req.params.cartId, // Assume cartId comes from params
  }).populate({
    path: "PaymentId",
    select: "PaymentStatus",
  });

  // Check if booking exist
  if (booking) {
    // Check if the payment status is in the removable statuses
    if (removableStatuses.includes(booking.PaymentId.PaymentStatus)) {
      // Delete the booking
      await BookingService.deleteOne({ _id: booking._id });

      console.log(
        `Booking deleted because PaymentStatus is '${booking.PaymentId.PaymentStatus}'`
      );
    }
  }

  cart.cart = cart.cart.filter((item) => item._id.toString() !== cartId);

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart item deleted successfully",
  });
});

const data = {
  _id: "6798b5ea74b9e1ccbbfcf7a1",
  User: "677e4eab3d4d9663cadefe95",
  cart: [
    {
      TimeSlot: {
        start: "2025-03-07T08:43:00.000Z",
        end: "2025-03-07T09:43:00.000Z",
      },
      Location: { type: "Point", coordinates: [76.8463543, 30.7297052] },
      categoryId: "676e813cd37f244e08a47594",
      addOns: "676e54c6d187f38ab315f2a4",
      Duration: 1,
      TotalPrice: 10,
      UserAddress:
        "14, it park rd, phase - i, sector 13, chandigarh, sukteri, chandigarh 133301, india",
      _id: "67ca95b9c6f6d8af1a1791f3",
    },
  ],
  createdAt: "2025-01-28T10:48:10.411Z",
  updatedAt: "2025-03-07T06:44:09.046Z",
  __v: 26,
};
