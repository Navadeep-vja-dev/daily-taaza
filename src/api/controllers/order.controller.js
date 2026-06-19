const OrderServiceServer = require('../../domain/orders/OrderService.server');
const PaymentServiceServer = require('../../domain/payments/PaymentService.server');
const { success } = require('../../shared/utils/response');
const AppError = require('../../shared/errors/AppError');

exports.create = async (req, res) => {
  const customerId = req.customer?.sub || null;
  const order = await OrderServiceServer.createOrder(req.cartToken, req.body, customerId);
  const response = { order };
  if (req.body.paymentMethod === 'online') {
    try {
      response.payment = await PaymentServiceServer.createPaymentOrder(order.orderNumber);
    } catch (err) {
      response.paymentError = err.message;
    }
  }
  return success(res, response, 201);
};

exports.getOne = async (req, res) => {
  const order = await OrderServiceServer.getByOrderNumber(req.params.orderNumber);
  const phoneLast4 = req.query.phoneLast4;
  const customerId = req.customer?.sub;

  if (customerId) {
    if (order.customerId !== customerId) throw AppError.forbidden('Access denied');
  } else if (phoneLast4) {
    if (!order.deliveryPhone.endsWith(phoneLast4)) {
      throw AppError.forbidden('Phone verification failed');
    }
  } else {
    throw AppError.unauthorized('Authentication or phone verification required');
  }

  return success(res, order);
};

exports.track = async (req, res) => {
  const order = await OrderServiceServer.track(req.params.orderNumber, req.query.phoneLast4);
  return success(res, order);
};

exports.list = async (req, res) => {
  const orders = await OrderServiceServer.getAll();
  return success(res, orders);
};

exports.updateStatus = async (req, res) => {
  const order = await OrderServiceServer.updateStatus(
    req.params.orderNumber,
    req.body.status,
    req.body.note,
    req.admin?.sub
  );
  return success(res, order);
};
