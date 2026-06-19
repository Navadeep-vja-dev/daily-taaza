const CustomerAuthServiceServer = require('../../domain/auth/CustomerAuthService.server');
const CustomerServiceServer = require('../../domain/customers/CustomerService.server');
const { success } = require('../../shared/utils/response');

exports.register = async (req, res) => {
  const result = await CustomerAuthServiceServer.register(req.body);
  return success(res, result, 201);
};

exports.login = async (req, res) => {
  const result = await CustomerAuthServiceServer.login(req.body.phone, req.body.password);
  return success(res, result);
};

exports.me = async (req, res) => {
  const profile = await CustomerServiceServer.getProfile(req.customer.sub);
  return success(res, profile);
};

exports.updateMe = async (req, res) => {
  const profile = await CustomerServiceServer.updateProfile(req.customer.sub, req.body);
  return success(res, profile);
};

exports.logout = async (req, res) => {
  return success(res, { loggedOut: true });
};

exports.listOrders = async (req, res) => {
  const orders = await CustomerServiceServer.listOrders(req.customer.sub);
  return success(res, orders);
};

exports.getOrder = async (req, res) => {
  const order = await CustomerServiceServer.getOrder(req.customer.sub, req.params.orderNumber);
  return success(res, order);
};

exports.cancelOrder = async (req, res) => {
  const order = await CustomerServiceServer.cancelOrder(req.customer.sub, req.params.orderNumber);
  return success(res, order);
};

exports.reorder = async (req, res) => {
  const result = await CustomerServiceServer.reorder(
    req.customer.sub,
    req.params.orderNumber,
    req.cartToken
  );
  res.setHeader('X-Cart-Token', result.cartToken);
  return success(res, result);
};

exports.listAddresses = async (req, res) => {
  const addresses = await CustomerServiceServer.listAddresses(req.customer.sub);
  return success(res, addresses);
};

exports.createAddress = async (req, res) => {
  const address = await CustomerServiceServer.createAddress(req.customer.sub, req.body);
  return success(res, address, 201);
};

exports.updateAddress = async (req, res) => {
  const address = await CustomerServiceServer.updateAddress(
    req.customer.sub,
    req.params.id,
    req.body
  );
  return success(res, address);
};

exports.deleteAddress = async (req, res) => {
  const result = await CustomerServiceServer.deleteAddress(req.customer.sub, req.params.id);
  return success(res, result);
};
