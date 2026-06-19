const crypto = require('crypto');
const { env } = require('../../shared/config/env');

let razorpayInstance = null;

function getRazorpay() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) return null;
  if (!razorpayInstance) {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  }
  return razorpayInstance;
}

const RazorpayProvider = {
  async createOrder(amountInr, receipt) {
    const rzp = getRazorpay();
    if (!rzp) {
      return { id: `order_stub_${Date.now()}`, amount: Math.round(amountInr * 100), currency: 'INR' };
    }
    return rzp.orders.create({
      amount: Math.round(amountInr * 100),
      currency: 'INR',
      receipt,
    });
  },

  verifySignature(orderId, paymentId, signature) {
    if (!env.razorpay.keySecret) return true;
    const body = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', env.razorpay.keySecret).update(body).digest('hex');
    return expected === signature;
  },
};

module.exports = RazorpayProvider;
