import Stripe from "stripe";
import { BookingService } from "../../models/Client/booking.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const stripe = new Stripe(process.env.STRIPE_SERCRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function updateBookingStatus(bookingId, updates) {
  try {
    const updatedBooking = await BookingService.findByIdAndUpdate(
      bookingId,
      updates,
      { new: true }
    );

    if (updatedBooking) {
      console.log("Booking updated:", updatedBooking);
    } else {
      console.error("No booking found for provided ID:", bookingId);
    }
  } catch (error) {
    console.error("Error updating booking:", error.message);
  }
}

async function handleEvent(eventType, paymentIntent) {
  const bookingId = paymentIntent.metadata.orderId;

  const statusUpdates = {
    "payment_intent.amount_capturable_updated": {
      PaymentStatus: "amount_capturable",
    },
    "payment_intent.canceled": {
      PaymentStatus: "canceled",
      BookingStatus: false,
    },
    "payment_intent.created": { PaymentStatus: "created" },
    "payment_intent.partially_funded": { PaymentStatus: "partially_funded" },
    "payment_intent.payment_failed": {
      PaymentStatus: "failed",
      BookingStatus: false,
    },
    "payment_intent.processing": { PaymentStatus: "processing" },
    "payment_intent.succeeded": { PaymentStatus: "paid", BookingStatus: true },
  };

  if (statusUpdates[eventType]) {
    await updateBookingStatus(bookingId, statusUpdates[eventType]);
  } else {
    console.warn(`Unhandled event type: ${eventType}`);
  }
}

export const verifyStripePayment = asyncHandler(async (request, response) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
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

  // Acknowledge receipt of the event
  response.status(200).send("Webhook event processed");
});
