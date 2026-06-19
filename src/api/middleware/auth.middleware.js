const AuthServiceServer = require('../../domain/auth/AuthService.server');
const AppError = require('../../shared/errors/AppError');

function requireAdminAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw AppError.unauthorized();
    req.admin = AuthServiceServer.verifyAdminToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!AuthServiceServer.hasPermission(req.admin, permission)) {
      return next(AppError.forbidden('Insufficient permissions'));
    }
    next();
  };
}

module.exports = { requireAdminAuth, requirePermission };
