const PaymentServiceServer = require('../../domain/payments/PaymentService.server');
const { success } = require('../../shared/utils/response');

exports.createOrder = async (req, res) => {
  const data = await PaymentServiceServer.createPaymentOrder(req.body.orderNumber);
  return success(res, data);
};

exports.verify = async (req, res) => {
  const order = await PaymentServiceServer.verifyPayment(
    req.body.orderNumber,
    req.body.razorpay_order_id,
    req.body.razorpay_payment_id,
    req.body.razorpay_signature
  );
  return success(res, order);
};

exports.webhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const result = await PaymentServiceServer.handleWebhook(req.body, signature);
  return success(res, result);
};
