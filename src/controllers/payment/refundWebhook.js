import Stripe from "stripe";
import { BookingService } from "../../models/Client/booking.model";
import { PaymentModel } from "../../models/Client/paymentModel";

const stripe = new Stripe(process.env.STRIPE_SERCRET_KEY);

const refundPaymentHook = async (request, response) => {
  const sig = request.headers["stripe-signature"];

  const rawBody = request.rawBody;

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;
  const refundData = data.object;

  const bookingId = refundData.metadata.bookingModelId;

  const booking = await BookingService.findById(bookingId);

  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  const paymentModel = await PaymentModel.findById(booking.PaymentId);

  // Handle the event
  switch (type) {
    case "refund.created":
      const refundCreated = event.data.object;
      // Then define and call a function to handle the event refund.created
      paymentModel.PaymentStatus = "created";
      break;
    case "refund.failed":
      const refundFailed = event.data.object;
      // Then define and call a function to handle the event refund.failed
      paymentModel.PaymentStatus = "failed";
      await paymentModel.save();

      if (!booking.Cleaner) {
        booking.BookingStatus = "Pending";
      } else {
        booking.BookingStatus = "Confirm";
      }
      break;
    case "refund.updated":
      const refundUpdated = event.data.object;
      // Then define and call a function to handle the event refund.updated
      paymentModel.PaymentStatus = "refunded";
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  await paymentModel.save();
  await booking.save();

  response.send();
};

export default refundPaymentHook;
