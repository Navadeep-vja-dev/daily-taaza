const db = require('./db');
const { mapCategoryRow } = require('../../shared/utils/mappers');

const CategoryMysql = {
  async getAll(activeOnly = true) {
    if (db.isMemoryMode()) {
      let rows = db.getMemory().categories;
      if (activeOnly) rows = rows.filter((c) => c.is_active);
      return rows.map(mapCategoryRow);
    }
    let sql = 'SELECT * FROM categories';
    if (activeOnly) sql += ' WHERE is_active = 1';
    sql += ' ORDER BY sort_order, label';
    const [rows] = await db.query(sql);
    return rows.map(mapCategoryRow);
  },

  async getById(id) {
    if (db.isMemoryMode()) {
      return mapCategoryRow(db.getMemory().categories.find((c) => c.id === id));
    }
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    return mapCategoryRow(rows[0]);
  },

  async create(data) {
    if (db.isMemoryMode()) {
      db.getMemory().categories.push(data);
      return mapCategoryRow(data);
    }
    await db.query(
      'INSERT INTO categories (id, label, sort_order, is_active) VALUES (?, ?, ?, ?)',
      [data.id, data.label, data.sort_order || 0, data.is_active ?? 1]
    );
    return this.getById(data.id);
  },

  async update(id, data) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      const idx = mem.categories.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      mem.categories[idx] = { ...mem.categories[idx], ...data };
      return mapCategoryRow(mem.categories[idx]);
    }
    await db.query(
      'UPDATE categories SET label = COALESCE(?, label), sort_order = COALESCE(?, sort_order), is_active = COALESCE(?, is_active) WHERE id = ?',
      [data.label, data.sort_order, data.is_active, id]
    );
    return this.getById(id);
  },

  async delete(id) {
    if (db.isMemoryMode()) {
      const c = db.getMemory().categories.find((x) => x.id === id);
      if (!c) return false;
      c.is_active = 0;
      return true;
    }
    await db.query('UPDATE categories SET is_active = 0 WHERE id = ?', [id]);
    return true;
  },
};

module.exports = CategoryMysql;
