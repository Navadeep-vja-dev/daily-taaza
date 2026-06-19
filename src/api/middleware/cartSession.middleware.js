const CartMysql = require('../../data/mysql/cart.mysql');
const ProductImageMysql = require('../../data/mysql/productImage.mysql');

async function cartSession(req, res, next) {
  try {
    const token = req.headers['x-cart-token'] || req.cookies?.cartToken || null;
    const customerId = req.customer?.sub || null;
    const { token: cartToken } = await CartMysql.getOrCreateSession(token, customerId);
    req.cartToken = cartToken;
    res.setHeader('X-Cart-Token', cartToken);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = cartSession;
