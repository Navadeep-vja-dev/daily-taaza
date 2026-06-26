const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { env } = require('../../shared/config/env');
const AppError = require('../../shared/errors/AppError');
const { isAllowedImageFile } = require('../../shared/utils/productImageFiles');

const PRODUCT_MAX_IMAGES = 10;

const uploadDir = path.join(process.cwd(), env.upload.dir, 'products');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const productId = req.params?.id || req.body?.productId || 'product';
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${productId}-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.upload.maxSizeMb * 1024 * 1024,
    files: PRODUCT_MAX_IMAGES,
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedImageFile(file)) {
      return cb(AppError.badRequest('Only JPG, JPEG, PNG, and WEBP images are allowed'));
    }
    cb(null, true);
  },
});

function handleProductImagesUpload(req, res, next) {
  upload.array('images', PRODUCT_MAX_IMAGES)(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}

function handleSingleImageUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}

module.exports = {
  upload,
  uploadDir,
  PRODUCT_MAX_IMAGES,
  handleProductImagesUpload,
  handleSingleImageUpload,
};
