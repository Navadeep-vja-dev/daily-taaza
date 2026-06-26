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

function toVariantRow(productId, v) {
  return {
    id: v.id,
    product_id: productId,
    label: v.label,
    weight_grams: v.weight_grams ?? v.weightGrams ?? null,
    price: v.price,
    compare_price: v.compare_price ?? v.comparePrice ?? null,
    stock_qty: v.stock_qty ?? v.stockQty ?? 100,
    is_default: 0,
    sort_order: v.sort_order ?? v.sortOrder ?? 0,
  };
}

async function isVariantInCart(variantId) {
  if (db.isMemoryMode()) {
    const mem = db.getMemory();
    for (const items of mem.cartItems.values()) {
      if (items.some((i) => i.variant_id === variantId)) return true;
    }
    return false;
  }
  const [rows] = await db.query('SELECT COUNT(*) AS c FROM cart_items WHERE variant_id = ?', [variantId]);
  return Number(rows[0].c) > 0;
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
    const existing = await this.getByProductId(productId);
    const newIds = new Set(variants.map((v) => v.id));
    const defaultVariant = variants.find((v) => v.is_default || v.isDefault) || variants[0];

    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      if (!mem.productVariants) mem.productVariants = [];

      for (const v of variants) {
        const row = toVariantRow(productId, v);
        const idx = mem.productVariants.findIndex((x) => x.id === row.id);
        if (idx >= 0) mem.productVariants[idx] = row;
        else mem.productVariants.push(row);
      }

      for (const old of existing) {
        if (newIds.has(old.id)) continue;
        if (await isVariantInCart(old.id)) {
          throw new Error(`Cannot remove variant "${old.label}" because it is in a customer cart`);
        }
        mem.productVariants = mem.productVariants.filter((x) => x.id !== old.id);
      }

      mem.productVariants.forEach((v) => {
        if (v.product_id === productId) {
          v.is_default = defaultVariant && v.id === defaultVariant.id ? 1 : 0;
        }
      });

      return this.getByProductId(productId);
    }

    await db.query('UPDATE product_variants SET is_default = 0 WHERE product_id = ?', [productId]);

    for (const v of variants) {
      const row = toVariantRow(productId, v);
      await db.query(
        `INSERT INTO product_variants (id, product_id, label, weight_grams, price, compare_price, stock_qty, is_default, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           product_id = VALUES(product_id),
           label = VALUES(label),
           weight_grams = VALUES(weight_grams),
           price = VALUES(price),
           compare_price = VALUES(compare_price),
           stock_qty = VALUES(stock_qty),
           is_default = VALUES(is_default),
           sort_order = VALUES(sort_order)`,
        [
          row.id,
          row.product_id,
          row.label,
          row.weight_grams,
          row.price,
          row.compare_price,
          row.stock_qty,
          row.is_default,
          row.sort_order,
        ]
      );
    }

    if (defaultVariant) {
      await db.query('UPDATE product_variants SET is_default = 1 WHERE id = ? AND product_id = ?', [
        defaultVariant.id,
        productId,
      ]);
    }

    for (const old of existing) {
      if (newIds.has(old.id)) continue;
      if (await isVariantInCart(old.id)) {
        throw new Error(`Cannot remove variant "${old.label}" because it is in a customer cart`);
      }
      await db.query('DELETE FROM product_variants WHERE id = ? AND product_id = ?', [old.id, productId]);
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
