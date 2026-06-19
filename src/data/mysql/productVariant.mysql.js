const db = require('./db');

function mapVariantRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id,
    label: row.label,
    weightGrams: row.weight_grams,
    price: Number(row.price),
    comparePrice: row.compare_price != null ? Number(row.compare_price) : null,
    stockQty: row.stock_qty,
    isDefault: Boolean(row.is_default),
    sortOrder: row.sort_order,
  };
}

const ProductVariantMysql = {
  mapVariantRow,

  async getByProductId(productId) {
    if (db.isMemoryMode()) {
      return (db.getMemory().productVariants || [])
        .filter((v) => v.product_id === productId)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(mapVariantRow);
    }
    const [rows] = await db.query(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC, label ASC',
      [productId]
    );
    return rows.map(mapVariantRow);
  },

  async getById(id) {
    if (db.isMemoryMode()) {
      const row = (db.getMemory().productVariants || []).find((v) => v.id === id);
      return mapVariantRow(row);
    }
    const [rows] = await db.query('SELECT * FROM product_variants WHERE id = ? LIMIT 1', [id]);
    return mapVariantRow(rows[0]);
  },

  async getDefaultForProduct(productId) {
    const variants = await this.getByProductId(productId);
    return variants.find((v) => v.isDefault) || variants[0] || null;
  },

  async replaceForProduct(productId, variants) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      mem.productVariants = (mem.productVariants || []).filter((v) => v.product_id !== productId);
      for (const v of variants) {
        mem.productVariants.push({
          id: v.id,
          product_id: productId,
          label: v.label,
          weight_grams: v.weight_grams ?? v.weightGrams ?? null,
          price: v.price,
          compare_price: v.compare_price ?? v.comparePrice ?? null,
          stock_qty: v.stock_qty ?? v.stockQty ?? 100,
          is_default: v.is_default ?? v.isDefault ? 1 : 0,
          sort_order: v.sort_order ?? v.sortOrder ?? 0,
        });
      }
      return this.getByProductId(productId);
    }

    await db.query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    for (const v of variants) {
      await db.query(
        `INSERT INTO product_variants (id, product_id, label, weight_grams, price, compare_price, stock_qty, is_default, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          v.id,
          productId,
          v.label,
          v.weight_grams ?? v.weightGrams ?? null,
          v.price,
          v.compare_price ?? v.comparePrice ?? null,
          v.stock_qty ?? v.stockQty ?? 100,
          v.is_default ?? v.isDefault ? 1 : 0,
          v.sort_order ?? v.sortOrder ?? 0,
        ]
      );
    }
    return this.getByProductId(productId);
  },

  async decrementStock(variantId, qty, connection) {
    const q = connection ? connection.query.bind(connection) : db.query;
    if (db.isMemoryMode()) {
      const v = (db.getMemory().productVariants || []).find((x) => x.id === variantId);
      if (!v || v.stock_qty < qty) throw new Error('Insufficient stock');
      v.stock_qty -= qty;
      return;
    }
    const [result] = await q(
      'UPDATE product_variants SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?',
      [qty, variantId, qty]
    );
    if (result.affectedRows === 0) throw new Error('Insufficient stock');
  },
};

module.exports = ProductVariantMysql;
