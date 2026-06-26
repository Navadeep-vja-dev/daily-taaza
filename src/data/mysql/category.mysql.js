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
    sql += ' ORDER BY id';
    const [rows] = await db.query(sql);
    return rows.map(mapCategoryRow);
  },

  async getById(id) {
    if (db.isMemoryMode()) {
      return mapCategoryRow(db.getMemory().categories.find((c) => Number(c.id) === Number(id)));
    }
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    return mapCategoryRow(rows[0]);
  },

  async create(data) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      const maxId = mem.categories.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0);
      const row = { id: maxId + 1, label: data.label, is_active: data.is_active ?? 1 };
      mem.categories.push(row);
      return mapCategoryRow(row);
    }
    const [result] = await db.query('INSERT INTO categories (label, is_active) VALUES (?, ?)', [
      data.label,
      data.is_active ?? 1,
    ]);
    return this.getById(result.insertId);
  },

  async update(id, data) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      const idx = mem.categories.findIndex((c) => Number(c.id) === Number(id));
      if (idx === -1) return null;
      mem.categories[idx] = { ...mem.categories[idx], ...data };
      return mapCategoryRow(mem.categories[idx]);
    }
    await db.query(
      'UPDATE categories SET label = COALESCE(?, label), is_active = COALESCE(?, is_active) WHERE id = ?',
      [data.label, data.is_active, id]
    );
    return this.getById(id);
  },

  async delete(id) {
    if (db.isMemoryMode()) {
      const c = db.getMemory().categories.find((x) => Number(x.id) === Number(id));
      if (!c) return false;
      c.is_active = 0;
      return true;
    }
    await db.query('UPDATE categories SET is_active = 0 WHERE id = ?', [id]);
    return true;
  },
};

module.exports = CategoryMysql;
