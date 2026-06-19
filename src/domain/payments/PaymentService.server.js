const crypto = require('crypto');
const { env } = require('../../shared/config/env');
const OrderMysql = require('../../data/mysql/order.mysql');
const PaymentMysql = require('../../data/mysql/payment.mysql');
const RazorpayProvider = require('../../data/providers/razorpay.provider');
const WhatsAppServiceServer = require('../whatsapp/WhatsAppService.server');
const AppError = require('../../shared/errors/AppError');

const PaymentServiceServer = {
  async createPaymentOrder(orderNumber) {
    const order = await OrderMysql.getByOrderNumber(orderNumber);
    if (!order) throw AppError.notFound('Order not found');
    if (order.paymentMethod !== 'online') throw AppError.badRequest('Order is not online payment');

    let payment = await PaymentMysql.findByOrderId(order.id);
    if (!payment) payment = await PaymentMysql.create(order.id, order.total);

    const rzpOrder = await RazorpayProvider.createOrder(order.total, order.orderNumber);
    await PaymentMysql.updateProviderOrderId(payment.id, rzpOrder.id);

    return {
      keyId: env.razorpay.keyId || 'rzp_test_stub',
      orderId: rzpOrder.id,
      amount: Math.round(order.total * 100),
      currency: 'INR',
      orderNumber: order.orderNumber,
    };
  },

  async verifyPayment(orderNumber, razorpayOrderId, razorpayPaymentId, signature) {
    const valid = RazorpayProvider.verifySignature(razorpayOrderId, razorpayPaymentId, signature);
    if (!valid) throw AppError.badRequest('Invalid payment signature');

    const order = await OrderMysql.getByOrderNumber(orderNumber);
    if (!order) throw AppError.notFound('Order not found');

    const payment = await PaymentMysql.findByOrderId(order.id);
    if (payment) {
      await PaymentMysql.markCaptured(payment.id, razorpayPaymentId, { razorpayOrderId, razorpayPaymentId });
    }
    await OrderMysql.updatePaymentStatus(orderNumber, 'paid');
    const updated = await OrderMysql.getByOrderNumber(orderNumber);
    try {
      await WhatsAppServiceServer.sendOrderConfirmation(updated);
    } catch (err) {
      // non-blocking
    }
    return updated;
  },

  async handleWebhook(body, signature) {
    const expected = crypto
      .createHmac('sha256', env.razorpay.webhookSecret || 'stub')
      .update(JSON.stringify(body))
      .digest('hex');
    if (env.razorpay.webhookSecret && signature !== expected) {
      throw AppError.unauthorized('Invalid webhook signature');
    }
    const event = body.event;
    const paymentEntity = body.payload?.payment?.entity;
    if (event === 'payment.captured' && paymentEntity) {
      const orderNumber = paymentEntity.notes?.order_number;
      if (orderNumber) await OrderMysql.updatePaymentStatus(orderNumber, 'paid');
    }
    return { received: true };
  },
};

module.exports = PaymentServiceServer;
