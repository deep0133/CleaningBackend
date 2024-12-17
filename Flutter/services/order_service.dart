class OrderService {
  static const String apiUrl = 'http://your-server-url:3000';

  static Future<bool> verifyOrder(List<OrderItem> items, int totalAmount) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/verify-order'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'items': items.map((item) => item.toJson()).toList(),
          'totalAmount': totalAmount,
        }),
      );

      final data = json.decode(response.body);
      return data['verified'] ?? false;
    } catch (e) {
      throw 'Order verification failed: $e';
    }
  }

  static Future<String> completeOrder(String orderId, String paymentIntentId) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/complete-order'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'orderId': orderId,
          'paymentIntentId': paymentIntentId,
        }),
      );

      final data = json.decode(response.body);
      if (data['success'] != true) throw 'Order completion failed';
      return data['order']['status'];
    } catch (e) {
      throw 'Order completion failed: $e';
    }
  }
}