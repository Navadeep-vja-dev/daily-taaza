const CustomerAuthServiceServer = require('../../domain/auth/CustomerAuthService.server');
const AppError = require('../../shared/errors/AppError');

function requireCustomerAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(AppError.unauthorized('Authentication required'));
  try {
    req.customer = CustomerAuthServiceServer.verifyCustomerToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

function optionalCustomerAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.customer = CustomerAuthServiceServer.verifyCustomerToken(token);
    } catch {
      /* ignore invalid token */
    }
  }
  next();
}

module.exports = { requireCustomerAuth, optionalCustomerAuth };
