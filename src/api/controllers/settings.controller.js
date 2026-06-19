const SettingsMysql = require('../../data/mysql/settings.mysql');
const ProductImageMysql = require('../../data/mysql/productImage.mysql');
const path = require('path');
const { success } = require('../../shared/utils/response');
const AppError = require('../../shared/errors/AppError');

exports.getPublicSettings = async (req, res) => {
  const settings = await SettingsMysql.getPublic();
  return success(res, settings);
};

exports.uploadProductImage = async (req, res) => {
  if (!req.file) throw AppError.badRequest('No file uploaded');
  const relativePath = path.join('uploads/products', req.file.filename).replace(/\\/g, '/');
  const webPath = `/${relativePath}`;
  if (req.body.productId) {
    await ProductImageMysql.create(req.body.productId, webPath, null, !req.body.append);
    await ProductImageMysql.syncProductPrimaryImage(req.body.productId);
  }
  return success(res, { path: webPath, filename: req.file.filename }, 201);
};
