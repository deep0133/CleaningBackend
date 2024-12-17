const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Set your Stripe secret key
const express = require('express');
const app = express();

app.use(express.json());

// Function to handle product checkout
const checkoutProducts = async (productRequest) => {
  try {
    // Build the product data
    const productData = {
      name: productRequest.name,
    };

    // Build the price data
    const priceData = {
      currency: productRequest.currency || 'USD',
      unit_amount: productRequest.amount,
      product_data: productData,
    };

    // Build the line item
    const lineItem = {
      price_data: priceData,
      quantity: productRequest.quantity,
    };

    // Create the session parameters
    const params = {
      payment_method_types: ['card'], // Payment methods
      mode: 'payment',
      success_url: 'http://localhost:8080/success', // Adjust the URLs as needed
      cancel_url: 'http://localhost:8080/cancel',
      line_items: [lineItem],
    };

    // Create the session
    const session = await stripe.checkout.sessions.create(params);

    // Return success response
    return {
      status: 'SUCCESS',
      message: 'Payment session created successfully',
      sessionId: session.id,
      sessionUrl: session.url,
    };
  } catch (error) {
    // Log and return failure response
    console.error(error.message);
    return {
      status: 'FAILED',
      message: `Failed to create payment session: ${error.message}`,
    };
  }
};

// Example endpoint
app.post('/checkout', async (req, res) => {
  const productRequest = req.body; // Get the product request from the request body
  const response = await checkoutProducts(productRequest);
  res.json(response);
});

// Start the server
app.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});