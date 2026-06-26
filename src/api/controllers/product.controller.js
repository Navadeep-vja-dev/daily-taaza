const { ProductServiceServer } = require('../../domain/products/ProductService.server');
const ProductImageMysql = require('../../data/mysql/productImage.mysql');
const { success } = require('../../shared/utils/response');
const AppError = require('../../shared/errors/AppError');
const { env } = require('../../shared/config/env');
const { deleteUploadedImageFile, webPathFromFilename } = require('../../shared/utils/productImageFiles');
const { PRODUCT_MAX_IMAGES } = require('../middleware/upload.middleware');

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
  try {
    const product = await ProductServiceServer.create(req.body);
    return success(res, product, 201);
  } catch (err) {
    if (err.message === 'Product ID already exists') {
      throw AppError.conflict(err.message);
    }
    throw err;
  }
};

exports.getNextId = async (req, res) => {
  const id = await ProductServiceServer.peekNextProductId();
  return success(res, { id });
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

exports.uploadImages = async (req, res) => {
  const productId = req.params.id;
  const product = await ProductServiceServer.getById(productId, { withVariants: false, withImages: false });
  if (!product) throw AppError.notFound('Product not found');

  const files = req.files || [];
  if (!files.length) throw AppError.badRequest('No images uploaded');

  const existingCount = await ProductImageMysql.countByProductId(productId);
  const maxImages = env.upload.maxImagesPerProduct || PRODUCT_MAX_IMAGES;
  if (existingCount + files.length > maxImages) {
    throw AppError.badRequest(
      `Maximum ${maxImages} images per product (${existingCount} already saved, ${files.length} selected)`
    );
  }

  const existingImages = await ProductImageMysql.getByProductId(productId);
  const hasPrimary = existingImages.some((i) => i.isPrimary);
  const created = [];

  for (let i = 0; i < files.length; i++) {
    const webPath = webPathFromFilename(files[i].filename);
    const isPrimary = !hasPrimary && i === 0;
    const image = await ProductImageMysql.create(productId, webPath, null, isPrimary);
    created.push(image);
  }

  await ProductImageMysql.syncProductPrimaryImage(productId);
  const images = await ProductImageMysql.getByProductId(productId);
  return success(res, { images, uploaded: created }, 201);
};

exports.deleteImage = async (req, res) => {
  const productId = req.params.id;
  const imageId = req.params.imageId;
  const imageCount = await ProductImageMysql.countByProductId(productId);
  if (imageCount <= 1) {
    throw AppError.badRequest(
      'Cannot delete the only product image. Upload another image first or delete the product.'
    );
  }

  const image = await ProductImageMysql.getById(productId, imageId);
  if (!image) throw AppError.notFound('Image not found');

  await ProductImageMysql.delete(productId, imageId);
  deleteUploadedImageFile(image.path);
  await ProductImageMysql.syncProductPrimaryImage(productId);

  const images = await ProductImageMysql.getByProductId(productId);
  return success(res, { deleted: true, images });
};

exports.setPrimaryImage = async (req, res) => {
  const image = await ProductImageMysql.setPrimary(req.params.id, req.params.imageId);
  if (!image) throw AppError.notFound('Image not found');
  await ProductImageMysql.syncProductPrimaryImage(req.params.id);
  return success(res, image);
};
