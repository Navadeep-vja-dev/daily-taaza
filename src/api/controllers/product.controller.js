const { ProductServiceServer } = require('../../domain/products/ProductService.server');
const ProductImageMysql = require('../../data/mysql/productImage.mysql');
const { success } = require('../../shared/utils/response');
const AppError = require('../../shared/errors/AppError');
const path = require('path');

exports.list = async (req, res) => {
  const isAdmin = req.path.startsWith('/admin/');
  const filters = {
    category: req.query.category,
    q: req.query.q,
    sort: req.query.sort,
    includeInactive: isAdmin && req.query.includeInactive === '1',
    withVariants: !isAdmin,
  };
  const products = await ProductServiceServer.getAll(filters);
  return success(res, products);
};

exports.getOne = async (req, res) => {
  const product = await ProductServiceServer.getById(req.params.id);
  if (!product) throw AppError.notFound('Product not found');
  return success(res, product);
};

exports.getRelated = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 4, 10);
  const products = await ProductServiceServer.getRelated(req.params.id, limit);
  return success(res, products);
};

exports.create = async (req, res) => {
  const product = await ProductServiceServer.create(req.body);
  return success(res, product, 201);
};

exports.update = async (req, res) => {
  const product = await ProductServiceServer.update(req.params.id, req.body);
  if (!product) throw AppError.notFound('Product not found');
  return success(res, product);
};

exports.remove = async (req, res) => {
  await ProductServiceServer.delete(req.params.id);
  return success(res, { deleted: true });
};

exports.uploadImage = async (req, res) => {
  if (!req.file) throw AppError.badRequest('No file uploaded');
  const productId = req.params.id;
  const relativePath = path.join('uploads/products', req.file.filename).replace(/\\/g, '/');
  const webPath = `/${relativePath}`;
  const isPrimary = req.body.isPrimary === 'true' || req.body.isPrimary === true;
  const image = await ProductImageMysql.create(productId, webPath, req.body.altText || null, isPrimary);
  await ProductImageMysql.syncProductPrimaryImage(productId);
  return success(res, image, 201);
};

exports.deleteImage = async (req, res) => {
  const ok = await ProductImageMysql.delete(req.params.id, req.params.imageId);
  if (!ok) throw AppError.notFound('Image not found');
  await ProductImageMysql.syncProductPrimaryImage(req.params.id);
  return success(res, { deleted: true });
};

exports.setPrimaryImage = async (req, res) => {
  const image = await ProductImageMysql.setPrimary(req.params.id, req.params.imageId);
  if (!image) throw AppError.notFound('Image not found');
  await ProductImageMysql.syncProductPrimaryImage(req.params.id);
  return success(res, image);
};
