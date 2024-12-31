import Stripe from "stripe";
import { asyncHandler } from "../../utils/asyncHandler.js";
import adminWallet from "../../models/adminWallet/adminWallet.model.js";

const stripe = new Stripe(process.env.STRIPE_SERCRET_KEY);
// STRIPE_SERCRET_KEY

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const balanceWebhook = asyncHandler(async (request, response) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle different event types
  switch (event.type) {
    case "balance.available":
      const balance = event.data.object; // The balance details
      console.log("Balance available:", balance);
      // const adminWallet = await adminWallet.findOne();

      // adminWallet.total += balance;
      // History data : ?
      // await adminWallet.save();

      // You can handle balance updates here (e.g., log it, notify admins, etc.)
      break;

    default:
      console.warn(`Unhandled event type: ${event.type}`);
      break;
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});
