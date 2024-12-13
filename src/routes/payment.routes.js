import express from 'express'
import { placeOrder,verifyOrder } from '../controllers/payment/stripe.contoller'


const paymentRouter=express.Router()

paymentRouter.post('/order',placeOrder)

paymentRouter.verify('/verify',verifyOrder)

export default paymentRouter