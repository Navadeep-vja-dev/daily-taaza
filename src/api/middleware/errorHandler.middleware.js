const AppError = require('../../shared/errors/AppError');
const { fail } = require('../../shared/utils/response');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.isOperational) return fail(res, err);
  console.error(err);
  return fail(res, AppError.badRequest(err.message || 'Internal server error'));
}

module.exports = errorHandler;
