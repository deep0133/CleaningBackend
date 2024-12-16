import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Stripe
  Stripe.publishableKey = 'YOUR_STRIPE_PUBLISHABLE_KEY';
  await Stripe.instance.applySettings();
  
  runApp(const MyApp());
}