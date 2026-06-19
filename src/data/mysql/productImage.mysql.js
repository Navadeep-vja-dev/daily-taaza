const db = require('./db');

function mapImageRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id,
    path: row.file_path,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    isPrimary: Boolean(row.is_primary),
  };
}

const ProductImageMysql = {
  mapImageRow,

  async getByProductId(productId) {
    if (db.isMemoryMode()) {
      return (db.getMemory().productImages || [])
        .filter((i) => i.product_id === productId)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(mapImageRow);
    }
    const [rows] = await db.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC',
      [productId]
    );
    return rows.map(mapImageRow);
  },

  async create(productId, filePath, altText = null, isPrimary = false) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      if (!mem.productImages) mem.productImages = [];
      if (isPrimary) {
        mem.productImages.forEach((i) => {
          if (i.product_id === productId) i.is_primary = 0;
        });
      }
      const row = {
        id: db.nextId(),
        product_id: productId,
        file_path: filePath,
        alt_text: altText,
        sort_order: mem.productImages.filter((i) => i.product_id === productId).length,
        is_primary: isPrimary ? 1 : 0,
      };
      mem.productImages.push(row);
      return mapImageRow(row);
    }

    if (isPrimary) {
      await db.query('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [productId]);
    }
    const [count] = await db.query(
      'SELECT COUNT(*) AS c FROM product_images WHERE product_id = ?',
      [productId]
    );
    const [result] = await db.query(
      'INSERT INTO product_images (product_id, file_path, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?)',
      [productId, filePath, altText, count[0].c, isPrimary ? 1 : 0]
    );
    const [rows] = await db.query('SELECT * FROM product_images WHERE id = ?', [result.insertId]);
    return mapImageRow(rows[0]);
  },

  async delete(productId, imageId) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      const idx = (mem.productImages || []).findIndex(
        (i) => i.id === Number(imageId) && i.product_id === productId
      );
      if (idx === -1) return false;
      mem.productImages.splice(idx, 1);
      return true;
    }
    const [result] = await db.query(
      'DELETE FROM product_images WHERE id = ? AND product_id = ?',
      [imageId, productId]
    );
    return result.affectedRows > 0;
  },

  async setPrimary(productId, imageId) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      (mem.productImages || []).forEach((i) => {
        if (i.product_id === productId) i.is_primary = i.id === Number(imageId) ? 1 : 0;
      });
      const primary = (mem.productImages || []).find((i) => i.id === Number(imageId));
      return primary ? mapImageRow(primary) : null;
    }
    await db.query('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [productId]);
    await db.query(
      'UPDATE product_images SET is_primary = 1 WHERE id = ? AND product_id = ?',
      [imageId, productId]
    );
    const [rows] = await db.query('SELECT * FROM product_images WHERE id = ?', [imageId]);
    return mapImageRow(rows[0]);
  },

  async syncProductPrimaryImage(productId) {
    const images = await this.getByProductId(productId);
    const primary = images.find((i) => i.isPrimary) || images[0];
    if (!primary) return;
    if (db.isMemoryMode()) {
      const p = db.getMemory().products.find((x) => x.id === productId);
      if (p) p.image = primary.path;
      return primary.path;
    }
    await db.query('UPDATE products SET image = ? WHERE id = ?', [primary.path, productId]);
    return primary.path;
  },
};

module.exports = ProductImageMysql;
