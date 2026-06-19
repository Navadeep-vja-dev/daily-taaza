const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../../shared/config/env');
const AdminMysql = require('../../data/mysql/admin.mysql');
const AppError = require('../../shared/errors/AppError');

const AuthServiceServer = {
  async loginAdmin(email, password) {
    const user = await AdminMysql.findByEmail(email);
    if (!user) throw AppError.unauthorized('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role_id, type: 'admin', permissions: user.permissions },
      env.jwt.accessSecret,
      { expiresIn: env.jwt.accessExpiresIn }
    );
    const refreshToken = jwt.sign({ sub: user.id, type: 'admin' }, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshExpiresIn,
    });
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expires = new Date(Date.now() + 7 * 86400000);
    await AdminMysql.saveRefreshToken(user.id, hash, expires);
    await AdminMysql.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.full_name, permissions: user.permissions },
    };
  },

  verifyAdminToken(token) {
    try {
      const payload = jwt.verify(token, env.jwt.accessSecret);
      if (payload.type !== 'admin') throw new Error('Invalid token type');
      return payload;
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }
  },

  hasPermission(user, permission) {
    if (!user.permissions) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  },
};

module.exports = AuthServiceServer;
