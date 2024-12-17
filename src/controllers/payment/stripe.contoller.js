
import orderModel from "../models/order.model.js";
import userModel from '../models/user.model.js'
import Stripe from "stripe"



const stripe=new Stripe(process.env.STRIPE_SERCRET_KEY)



const verifyOrder= async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    
    // Verify items are in stock
    const outOfStockItems = await checkStockAvailability(items);
    if (outOfStockItems.length > 0) {
      return res.status(400).json({
        error: 'Some items are out of stock',
        items: outOfStockItems
      });
    }

    // Verify prices and calculate total
    const calculatedTotal = await calculateOrderTotal(items);
    if (calculatedTotal !== totalAmount) {
      return res.status(400).json({
        error: 'Price mismatch',
        expectedTotal: calculatedTotal,
        receivedTotal: totalAmount
      });
    }

    res.json({ 
      verified: true,
      total: calculatedTotal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Create payment intent with order details
export const createBooking = asyncHandler(async (req, res) => {
    const {
      category,
      timeSlot, // { start: Date, end: Date }
      paymentMethod,
      paymentValue,
      userAddress,
      location, // { type: "Point", coordinates: [longitude, latitude] }
      addOns = [], // Array of add-ons selected by the user
    } = req.body;

    // -----stripe starts here---

    const priceData = {
      currency: productRequest.currency || 'USD',
      unit_amount: productRequest.amount,
      product_data: productData,
    };

    const lineItem = {
      price_data: priceData,
      quantity:1,
    };

    const params = {
      payment_method_types: ['card'], // Payment methods
      mode: 'payment',
      success_url: 'http://localhost:8080/success', // Adjust the URLs as needed
      cancel_url: 'http://localhost:8080/cancel',
      line_items: [lineItem],
    };

    const session = await stripe.checkout.sessions.create(params);

    // Saving data to database

    try {
      const booking = new BookingService({
        User: req.user._id,
        category,
        PaymentMethod: paymentMethod,
        PaymentValue: paymentValue,
        PaymentStatus: "pending",
        BookingStatus: false,
        TimeSlot: timeSlot,
        OTP: {
          start: Math.floor(1000 + Math.random() * 9000).toString(),
          end: Math.floor(1000 + Math.random() * 9000).toString(),
        },
        Duration: duration,
        TotalPrice: totalPrice,
        UserAddress: userAddress,
        Location: location,
      });
  
      await booking.save({ session });

      const duration = Math.round(
        (new Date(timeSlot.end) - new Date(timeSlot.start)) / (1000 * 60)
      );
      const totalPrice = calculateTotalPrice(category, addOns, duration); // Replace with your pricing logic

    return {
      status: 'SUCCESS',
      message: 'Payment session created successfully',
      sessionId: session.id,
      sessionUrl: session.url,
    };
    // Stripe ends here
    // const session = await mongoose.startSession();
    // session.startTransaction();
  
   
  
    //   const order = await Order.create({
    //     items: addOns,
    //     totalAmount: totalPrice,
    //     status: 'pending',
    //     user: req.user._id,
    //     createdAt: new Date(),
    //   });
  
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: totalPrice * 100,
    //     currency: "INR",
    //     metadata: {
    //       orderId: order._id.toString(),
    //     },
    //   });
  
    //   await session.commitTransaction();
    //   res.status(201).json({
    //     success: true,
    //     booking,
    //     clientSecret: paymentIntent.client_secret,
    //     orderId: order._id,
    //   });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create booking",
        stack: error.stack,
      });
    } finally {
      session.endSession();
    }
  });
  

// 3. Complete order after payment
app.post('/complete-order', async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    // Verify payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not successful');
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(orderId, {
      status: 'confirmed',
      paymentId: paymentIntentId,
      updatedAt: new Date()
    }, { new: true });

    // Reduce inventory quantities
    await updateInventory(order.items);

    // Send order confirmation email
    await sendOrderConfirmation(order);

    res.json({ 
      success: true, 
      order 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export {placeOrder,verifyOrder}