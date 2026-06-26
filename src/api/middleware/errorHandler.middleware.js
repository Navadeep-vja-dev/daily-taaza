const multer = require('multer');
const AppError = require('../../shared/errors/AppError');
const { fail } = require('../../shared/utils/response');
const { env } = require('../../shared/config/env');
const { PRODUCT_MAX_IMAGES } = require('./upload.middleware');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return fail(res, AppError.badRequest(`Each image must be at most ${env.upload.maxSizeMb}MB`));
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return fail(res, AppError.badRequest(`Maximum ${PRODUCT_MAX_IMAGES} images allowed per upload`));
    }
    return fail(res, AppError.badRequest(err.message));
  }
  if (err.isOperational) return fail(res, err);
  console.error(err);
  return fail(res, AppError.badRequest(err.message || 'Internal server error'));
}

module.exports = errorHandler;
