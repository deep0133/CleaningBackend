import Stripe from "stripe";
import { BookingService } from "../../models/Client/booking.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Cart } from "../../models/Client/cart.model.js";
import { PaymentModel } from "../../models/Client/paymentModel.js";

const stripe = new Stripe(process.env.STRIPE_SERCRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function updateBookingStatus(bookingId, updates) {
  try {
    const booking = await BookingService.findById(bookingId);

    if (!booking || !booking.PaymentId) {
      throw new Error("No booking found for provided ID");
    }

    const paymentModel = await PaymentModel.findById(booking.PaymentId);

    paymentModel.PaymentStatus = updates.PaymentStatus;

    await paymentModel.save();

    booking.PaymentId.PaymentStatus = updates.PaymentStatus;

    const cart = await Cart.findOne({ User: booking.User });

    if (!cart) {
      throw new Error("No cart found for provided ID");
    }

    cart.cart = [];
    await cart.save();
  } catch (error) {
    console.error("Error updating booking:", error.message);
  }
}

async function handleEvent(eventType, paymentIntent) {
  const bookingId = paymentIntent.metadata.bookingModelId;

  console.log("------------Handle Event---metadata---------", bookingId);

  const statusUpdates = {
    "payment_intent.amount_capturable_updated": {
      PaymentStatus: "amount_capturable",
    },
    "payment_intent.canceled": {
      PaymentStatus: "canceled",
    },
    "payment_intent.created": { PaymentStatus: "created" },
    "payment_intent.partially_funded": { PaymentStatus: "partially_funded" },
    "payment_intent.payment_failed": {
      PaymentStatus: "failed",
    },
    "payment_intent.processing": { PaymentStatus: "processing" },
    "payment_intent.succeeded": { PaymentStatus: "paid" },
  };

  if (statusUpdates[eventType]) {
    await updateBookingStatus(bookingId, statusUpdates[eventType]);
  } else {
    console.warn(`Unhandled event type: ${eventType}`);
  }
}

export const verifyStripePayment = asyncHandler(async (request, response) => {
  // const sig = request.headers["stripe-signature"];
  const sig = request.headers["stripe-signature"]; // Stripe's signature header
  const rawBody = request.rawBody; // Raw request body from express.raw

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;
  const paymentIntent = data.object;

  try {
    await handleEvent(type, paymentIntent);
  } catch (error) {
    console.error(`Error handling webhook event: ${error.message}`);
    return response.status(500).send("Internal Server Error");
  }

  // Notification Send to Cleaner and store data in notification model

  // Acknowledge receipt of the event
  response.status(200).send("Webhook event processed");
});
