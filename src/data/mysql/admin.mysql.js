const bcrypt = require('bcryptjs');
const db = require('./db');

const DEFAULT_ADMIN = {
  email: 'admin@dailytaaza.com',
  password: 'Admin@123',
  full_name: 'Daily Taaza Admin',
  role_id: 1,
};

const AdminMysql = {
  async seedDefaultAdmin() {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      if (!mem.adminUsers.length) {
        const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
        mem.adminUsers.push({
          id: 1,
          email: DEFAULT_ADMIN.email,
          password_hash: hash,
          full_name: DEFAULT_ADMIN.full_name,
          role_id: 1,
          is_active: 1,
          permissions: ['*'],
        });
      }
      return;
    }
    const [rows] = await db.query('SELECT id FROM admin_users LIMIT 1');
    if (rows.length) return;
    const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
    await db.query(
      'INSERT INTO admin_users (email, password_hash, full_name, role_id) VALUES (?, ?, ?, ?)',
      [DEFAULT_ADMIN.email, hash, DEFAULT_ADMIN.full_name, 1]
    );
  },

  async findByEmail(email) {
    if (db.isMemoryMode()) {
      const user = db.getMemory().adminUsers.find((u) => u.email === email && u.is_active);
      return user || null;
    }
    const [rows] = await db.query(
      `SELECT u.*, r.permissions FROM admin_users u
       JOIN admin_roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.is_active = 1 LIMIT 1`,
      [email]
    );
    if (rows[0]) rows[0].permissions = typeof rows[0].permissions === 'string' ? JSON.parse(rows[0].permissions) : rows[0].permissions;
    return rows[0] || null;
  },

  async findById(id) {
    if (db.isMemoryMode()) {
      return db.getMemory().adminUsers.find((u) => u.id === id) || null;
    }
    const [rows] = await db.query(
      `SELECT u.*, r.permissions FROM admin_users u
       JOIN admin_roles r ON u.role_id = r.id WHERE u.id = ? LIMIT 1`,
      [id]
    );
    if (rows[0]) rows[0].permissions = typeof rows[0].permissions === 'string' ? JSON.parse(rows[0].permissions) : rows[0].permissions;
    return rows[0] || null;
  },

  async updateLastLogin(id) {
    if (db.isMemoryMode()) return;
    await db.query('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [id]);
  },

  async saveRefreshToken(adminId, tokenHash, expiresAt) {
    if (db.isMemoryMode()) return;
    await db.query(
      'INSERT INTO admin_refresh_tokens (admin_user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [adminId, tokenHash, expiresAt]
    );
  },
};

module.exports = AdminMysql;
