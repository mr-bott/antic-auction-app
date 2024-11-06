// services/paymentService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/transactionModel');

class PaymentService {
  async createPaymentIntent(amount, currency = 'usd') {
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency
    });
  }

  async processAuctionPayment(bid, product) {
    try {
      const paymentIntent = await this.createPaymentIntent(bid.amount);
      
      const transaction = await Transaction.create({
        product_id: product.id,
        buyer_id: bid.bidder_id,
        seller_id: product.seller_id,
        amount: bid.amount,
        payment_intent_id: paymentIntent.id,
        status: 'pending'
      });

      return {
        clientSecret: paymentIntent.client_secret,
        transaction_id: transaction.id
      };
    } catch (error) {
      throw new Error('Payment processing failed: ' + error.message);
    }
  }

  async confirmPayment(paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      await Transaction.updateStatus(paymentIntent.metadata.transaction_id, 'completed');
      return true;
    }
    return false;
  }

  async refundPayment(transactionId) {
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const refund = await stripe.refunds.create({
      payment_intent: transaction.payment_intent_id
    });

    await Transaction.updateStatus(transactionId, 'refunded');
    return refund;
  }
}

module.exports = new PaymentService();