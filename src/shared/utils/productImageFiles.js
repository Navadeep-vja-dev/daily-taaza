const fs = require('fs');
const path = require('path');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function isUploadPath(filePath) {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, '/');
  return normalized.startsWith('/uploads/') || normalized.startsWith('uploads/');
}

function resolveDiskPath(filePath) {
  if (!isUploadPath(filePath)) return null;
  const normalized = filePath.replace(/\\/g, '/').replace(/^\//, '');
  return path.join(process.cwd(), normalized);
}

function deleteUploadedImageFile(filePath) {
  const diskPath = resolveDiskPath(filePath);
  if (!diskPath || !fs.existsSync(diskPath)) return;
  try {
    fs.unlinkSync(diskPath);
  } catch (err) {
    console.warn('Failed to delete image file:', diskPath, err.message);
  }
}

function deleteUploadedImageFiles(filePaths) {
  (filePaths || []).forEach(deleteUploadedImageFile);
}

function webPathFromFilename(filename) {
  return `/uploads/products/${filename}`;
}

function isAllowedImageFile(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  return ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext);
}

module.exports = {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  isUploadPath,
  resolveDiskPath,
  deleteUploadedImageFile,
  deleteUploadedImageFiles,
  webPathFromFilename,
  isAllowedImageFile,
};
