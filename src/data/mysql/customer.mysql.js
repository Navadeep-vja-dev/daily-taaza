const db = require('./db');
const { normalizePhone } = require('../../shared/utils/phone');

const CustomerMysql = {
  async findByPhone(phone) {
    const normalized = normalizePhone(phone);
    if (db.isMemoryMode()) {
      return (
        db.getMemory().customers.find((c) => normalizePhone(c.phone) === normalized) || null
      );
    }
    const [rows] = await db.query('SELECT * FROM customers WHERE phone = ? LIMIT 1', [normalized]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    if (db.isMemoryMode()) {
      return db.getMemory().customers.find((c) => c.email === email) || null;
    }
    const [rows] = await db.query('SELECT * FROM customers WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    if (db.isMemoryMode()) {
      return db.getMemory().customers.find((c) => c.id === id) || null;
    }
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const phone = normalizePhone(data.phone);
    if (db.isMemoryMode()) {
      const customer = {
        id: db.nextId(),
        ...data,
        phone,
        is_guest: data.is_guest ?? 1,
      };
      db.getMemory().customers.push(customer);
      return customer;
    }
    const [result] = await db.query(
      'INSERT INTO customers (full_name, email, phone, password_hash, is_guest) VALUES (?, ?, ?, ?, ?)',
      [data.full_name, data.email, phone, data.password_hash || null, data.is_guest ?? 1]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      const idx = mem.customers.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      mem.customers[idx] = { ...mem.customers[idx], ...data };
      return mem.customers[idx];
    }
    await db.query(
      `UPDATE customers SET
        full_name = COALESCE(?, full_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        password_hash = COALESCE(?, password_hash),
        is_guest = COALESCE(?, is_guest)
       WHERE id = ?`,
      [
        data.full_name,
        data.email,
        data.phone ? normalizePhone(data.phone) : null,
        data.password_hash,
        data.is_guest !== undefined ? data.is_guest : null,
        id,
      ]
    );
    return this.findById(id);
  },
};

module.exports = CustomerMysql;
