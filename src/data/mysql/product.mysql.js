const db = require('./db');
const ProductVariantMysql = require('./productVariant.mysql');
const ProductImageMysql = require('./productImage.mysql');
const { mapProductRow } = require('../../shared/utils/mappers');

async function enrichProduct(row, options = {}) {
  const product = mapProductRow(row);
  if (!product) return null;
  if (options.withVariants) {
    product.variants = await ProductVariantMysql.getByProductId(product.id);
    product.priceFrom = product.variants.length
      ? Math.min(...product.variants.map((v) => v.price))
      : product.price;
    product.variantCount = product.variants.length;
  }
  if (options.withImages) {
    product.images = await ProductImageMysql.getByProductId(product.id);
    const primary = product.images.find((i) => i.isPrimary) || product.images[0];
    if (primary) product.image = primary.path;
  }
  return product;
}

const ProductMysql = {
  async getAll(filters = {}) {
    const activeOnly = filters.includeInactive ? false : filters.activeOnly !== false;
    if (db.isMemoryMode()) {
      let rows = db.getMemory().products.filter((p) => (activeOnly ? p.is_active : true));
      if (filters.category && filters.category !== 'all') {
        rows = rows.filter((p) => p.category_id === filters.category);
      }
      if (filters.q) {
        const q = filters.q.toLowerCase();
        rows = rows.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
      }
      const products = [];
      for (const row of rows) {
        products.push(
          await enrichProduct(row, { withVariants: filters.withVariants, withImages: false })
        );
      }
      return products;
    }
    let sql = activeOnly ? 'SELECT * FROM products WHERE is_active = 1' : 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (filters.category && filters.category !== 'all') {
      sql += ' AND category_id = ?';
      params.push(filters.category);
    }
    if (filters.q) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.q}%`, `%${filters.q}%`);
    }
    if (filters.sort === 'price-asc') sql += ' ORDER BY price ASC';
    else if (filters.sort === 'price-desc') sql += ' ORDER BY price DESC';
    else if (filters.sort === 'name-asc') sql += ' ORDER BY name ASC';
    else sql += ' ORDER BY name ASC';
    const [rows] = await db.query(sql, params);
    const products = [];
    for (const row of rows) {
      products.push(
        await enrichProduct(row, { withVariants: filters.withVariants, withImages: false })
      );
    }
    return products;
  },

  async getById(id, options = { withVariants: true, withImages: true }) {
    if (db.isMemoryMode()) {
      const row = db.getMemory().products.find((p) => p.id === id);
      return enrichProduct(row, options);
    }
    const [rows] = await db.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    return enrichProduct(rows[0], options);
  },

  async create(data) {
    const variants = data.variants || [];
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      mem.products.push({ ...data, is_active: 1 });
      if (variants.length) await ProductVariantMysql.replaceForProduct(data.id, variants);
      else {
        await ProductVariantMysql.replaceForProduct(data.id, [
          {
            id: `${data.id}-500g`,
            label: '500g',
            weight_grams: 500,
            price: data.price,
            stock_qty: data.stock_qty || 100,
            is_default: 1,
            sort_order: 0,
          },
          {
            id: `${data.id}-1kg`,
            label: '1 kg',
            weight_grams: 1000,
            price: Math.round(data.price * 1.8),
            stock_qty: data.stock_qty || 100,
            is_default: 0,
            sort_order: 1,
          },
        ]);
      }
      await ProductImageMysql.create(data.id, data.image, data.name, true);
      return this.getById(data.id);
    }
    await db.query(
      `INSERT INTO products (id, category_id, name, slug, price, compare_price, badge, description,
        ingredients, benefits, image, placeholder_color, placeholder_text, stock_qty, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.category_id,
        data.name,
        data.slug,
        data.price,
        data.compare_price,
        data.badge,
        data.description,
        JSON.stringify(data.ingredients),
        JSON.stringify(data.benefits),
        data.image,
        data.placeholder_color,
        data.placeholder_text,
        data.stock_qty || 100,
        data.is_active ?? 1,
      ]
    );
    if (variants.length) {
      await ProductVariantMysql.replaceForProduct(data.id, variants);
    } else {
      await ProductVariantMysql.replaceForProduct(data.id, [
        {
          id: `${data.id}-500g`,
          label: '500g',
          weight_grams: 500,
          price: data.price,
          stock_qty: data.stock_qty || 100,
          is_default: 1,
          sort_order: 0,
        },
        {
          id: `${data.id}-1kg`,
          label: '1 kg',
          weight_grams: 1000,
          price: Math.round(data.price * 1.8),
          stock_qty: data.stock_qty || 100,
          is_default: 0,
          sort_order: 1,
        },
      ]);
    }
    await ProductImageMysql.create(data.id, data.image, data.name, true);
    return this.getById(data.id);
  },

  async update(id, data) {
    if (data.variants) {
      await ProductVariantMysql.replaceForProduct(id, data.variants);
      const defaultVariant = data.variants.find((v) => v.is_default || v.isDefault) || data.variants[0];
      if (defaultVariant) data.price = defaultVariant.price;
      delete data.variants;
    }
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      const idx = mem.products.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      mem.products[idx] = { ...mem.products[idx], ...data };
      return this.getById(id);
    }
    const fields = [];
    const values = [];
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) {
        fields.push(`${k} = ?`);
        values.push(
          typeof v === 'object' && !Array.isArray(v)
            ? v
            : Array.isArray(v)
              ? JSON.stringify(v)
              : v
        );
      }
    });
    if (fields.length) {
      values.push(id);
      await db.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.getById(id);
  },

  async delete(id) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      const idx = mem.products.findIndex((p) => p.id === id);
      if (idx === -1) return false;
      mem.products[idx].is_active = 0;
      return true;
    }
    await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    return true;
  },

  async decrementStock(productId, qty, connection) {
    const q = connection ? connection.query.bind(connection) : db.query;
    if (db.isMemoryMode()) {
      const p = db.getMemory().products.find((x) => x.id === productId);
      if (!p || p.stock_qty < qty) throw new Error('Insufficient stock');
      p.stock_qty -= qty;
      return;
    }
    const [result] = await q(
      'UPDATE products SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?',
      [qty, productId, qty]
    );
    if (result.affectedRows === 0) throw new Error('Insufficient stock');
  },
};

module.exports = ProductMysql;
