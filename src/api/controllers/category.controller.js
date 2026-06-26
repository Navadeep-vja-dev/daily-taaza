const { CategoryServiceServer } = require('../../domain/products/ProductService.server');
const { success } = require('../../shared/utils/response');
const AppError = require('../../shared/errors/AppError');

exports.list = async (req, res) => {
  const categories = await CategoryServiceServer.getAll();
  return success(res, categories);
};

exports.adminList = async (req, res) => {
  const categories = await CategoryServiceServer.getAll({ includeInactive: true });
  return success(res, categories);
};

exports.getOne = async (req, res) => {
  const category = await CategoryServiceServer.getById(req.params.id);
  if (!category) throw AppError.notFound('Category not found');
  return success(res, category);
};

exports.create = async (req, res) => {
  const category = await CategoryServiceServer.create(req.body);
  return success(res, category, 201);
};

exports.update = async (req, res) => {
  const category = await CategoryServiceServer.update(req.params.id, req.body);
  return success(res, category);
};

exports.remove = async (req, res) => {
  await CategoryServiceServer.delete(req.params.id);
  return success(res, { deleted: true });
};
