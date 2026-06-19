const CartMysql = require('../../data/mysql/cart.mysql');
const { success } = require('../../shared/utils/response');

exports.getCart = async (req, res) => {
  const customerId = req.customer?.sub || null;
  const { token } = await CartMysql.getOrCreateSession(req.cartToken, customerId);
  const items = await CartMysql.getItems(token);
  res.setHeader('X-Cart-Token', token);
  return success(res, { items, cartToken: token });
};

exports.addItem = async (req, res) => {
  const { productId, variantId, quantity } = req.body;
  const customerId = req.customer?.sub || null;
  const result = await CartMysql.addItem(
    req.cartToken,
    productId,
    quantity || 1,
    variantId || null,
    customerId
  );
  res.setHeader('X-Cart-Token', result.token);
  return success(res, { items: result.items, cartToken: result.token }, 201);
};

exports.updateItem = async (req, res) => {
  const customerId = req.customer?.sub || null;
  const result = await CartMysql.updateItem(
    req.cartToken,
    req.params.variantId,
    req.body.quantity,
    customerId
  );
  res.setHeader('X-Cart-Token', result.token);
  return success(res, { items: result.items, cartToken: result.token });
};

exports.removeItem = async (req, res) => {
  const customerId = req.customer?.sub || null;
  const result = await CartMysql.removeItem(req.cartToken, req.params.variantId, customerId);
  res.setHeader('X-Cart-Token', result.token);
  return success(res, { items: result.items, cartToken: result.token });
};

exports.clear = async (req, res) => {
  const result = await CartMysql.clear(req.cartToken);
  res.setHeader('X-Cart-Token', result.token);
  return success(res, { items: result.items, cartToken: result.token });
};
