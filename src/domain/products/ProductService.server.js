const ProductMysql = require('../../data/mysql/product.mysql');
const ProductSequenceMysql = require('../../data/mysql/productSequence.mysql');
const CategoryMysql = require('../../data/mysql/category.mysql');

const ProductServiceServer = {
  async getAll(filters = {}) {
    return ProductMysql.getAll({
      ...filters,
      withVariants: filters.withVariants !== false,
      activeOnly: filters.includeInactive ? false : filters.activeOnly !== false,
    });
  },

  async getById(id, options = { withVariants: true, withImages: true }) {
    return ProductMysql.getById(id, options);
  },

  async getRelated(id, limit = 4) {
    const product = await ProductMysql.getById(id, { withVariants: false, withImages: false });
    if (!product) return [];
    const all = await ProductMysql.getAll({ category: product.category, withVariants: false });
    return all.filter((p) => p.id !== id).slice(0, limit);
  },

  async create(data) {
    return ProductMysql.create(data);
  },

  async getNextProductId() {
    return ProductSequenceMysql.getNextProductId();
  },

  async peekNextProductId() {
    return ProductSequenceMysql.peekNextProductId();
  },

  async update(id, data) {
    return ProductMysql.update(id, data);
  },

  async delete(id) {
    return ProductMysql.delete(id);
  },
};

const CategoryServiceServer = {
  async getAll(options = {}) {
    return CategoryMysql.getAll(!options.includeInactive);
  },

  async getById(id) {
    return CategoryMysql.getById(id);
  },

  async create(data) {
    return CategoryMysql.create(data);
  },

  async update(id, data) {
    return CategoryMysql.update(id, data);
  },

  async delete(id) {
    return CategoryMysql.delete(id);
  },
};

module.exports = { ProductServiceServer, CategoryServiceServer };
