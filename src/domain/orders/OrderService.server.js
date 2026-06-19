const OrderMysql = require('../../data/mysql/order.mysql');
const PaymentMysql = require('../../data/mysql/payment.mysql');
const RazorpayProvider = require('../../data/providers/razorpay.provider');
const WhatsAppServiceServer = require('../whatsapp/WhatsAppService.server');
const AppError = require('../../shared/errors/AppError');

const OrderServiceServer = {
  async createOrder(cartToken, checkoutData, customerId = null) {
    const order = await OrderMysql.createFromCart(cartToken, checkoutData, customerId);
    try {
      await WhatsAppServiceServer.sendOrderConfirmation(order);
    } catch (err) {
      // non-blocking
    }
    return order;
  },

  async getByOrderNumber(orderNumber) {
    const order = await OrderMysql.getByOrderNumber(orderNumber);
    if (!order) throw AppError.notFound('Order not found');
    return order;
  },

  async track(orderNumber, phoneLast4) {
    const order = await this.getByOrderNumber(orderNumber);
    if (!order.deliveryPhone.endsWith(phoneLast4)) {
      throw AppError.forbidden('Phone verification failed');
    }
    return order;
  },

  async updateStatus(orderNumber, status, note, adminId) {
    const order = await OrderMysql.updateStatus(orderNumber, status, note, adminId);
    if (order) {
      try {
        await WhatsAppServiceServer.sendStatusUpdate(order);
      } catch (err) {
        // non-blocking
      }
    }
    return order;
  },

  async getAll() {
    return OrderMysql.getAll();
  },
};

module.exports = OrderServiceServer;
