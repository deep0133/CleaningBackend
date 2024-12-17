class PaymentService {
  static const String apiUrl = 'http://your-server-url:3000';
  
  static Future<void> processOrder({
    required List<OrderItem> items,
    required String currency,
    required Map<String, String> shippingAddress,
  }) async {
    try {
      // 1. Calculate total amount
      final totalAmount = items.fold(0, (sum, item) => sum + (item.price * item.quantity));

      // 2. Verify order
      final isVerified = await OrderService.verifyOrder(items, totalAmount);
      if (!isVerified) throw 'Order verification failed';

      // 3. Create payment intent
      final response = await http.post(
        Uri.parse('$apiUrl/create-payment-intent'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'amount': totalAmount,
          'currency': currency,
          'orderItems': items.map((item) => item.toJson()).toList(),
          'shippingAddress': shippingAddress,
        }),
      );

      final paymentIntentData = json.decode(response.body);
      if (paymentIntentData['clientSecret'] == null) throw 'Payment intent creation failed';

      // 4. Initialize payment sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: paymentIntentData['clientSecret'],
          merchantDisplayName: 'Your Store Name',
        ),
      );

      // 5. Present payment sheet
      await Stripe.instance.presentPaymentSheet();
      
      // 6. Complete order
      final orderStatus = await OrderService.completeOrder(
        paymentIntentData['orderId'],
        paymentIntentData['clientSecret'].split('_secret_')[0]
      );

      print('Order completed with status: $orderStatus');
      
    } catch (e) {
      throw 'Order processing failed: $e';
    }
  }
}
