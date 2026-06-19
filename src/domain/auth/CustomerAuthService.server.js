const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../shared/config/env');
const CustomerMysql = require('../../data/mysql/customer.mysql');
const AppError = require('../../shared/errors/AppError');
const { normalizePhone } = require('../../shared/utils/phone');

const CustomerAuthServiceServer = {
  async register({ phone, password, fullName, email }) {
    const normalized = normalizePhone(phone);
    if (normalized.length < 10) throw AppError.badRequest('Invalid phone number');

    const existing = await CustomerMysql.findByPhone(normalized);
    if (existing && !existing.is_guest) {
      throw AppError.conflict('Phone number already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    let customer;
    if (existing && existing.is_guest) {
      customer = await CustomerMysql.update(existing.id, {
        full_name: fullName,
        email: email || existing.email,
        password_hash: passwordHash,
        is_guest: 0,
      });
    } else {
      customer = await CustomerMysql.create({
        full_name: fullName,
        email: email || null,
        phone: normalized,
        password_hash: passwordHash,
        is_guest: 0,
      });
    }

    return this.issueToken(customer);
  },

  async login(phone, password) {
    const normalized = normalizePhone(phone);
    const customer = await CustomerMysql.findByPhone(normalized);
    if (!customer || customer.is_guest || !customer.password_hash) {
      throw AppError.unauthorized('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) throw AppError.unauthorized('Invalid credentials');
    return this.issueToken(customer);
  },

  issueToken(customer) {
    const accessToken = jwt.sign(
      { sub: customer.id, type: 'customer' },
      env.jwt.accessSecret,
      { expiresIn: env.jwt.accessExpiresIn }
    );
    return {
      accessToken,
      customer: {
        id: customer.id,
        fullName: customer.full_name,
        email: customer.email,
        phone: customer.phone,
      },
    };
  },

  verifyCustomerToken(token) {
    try {
      const payload = jwt.verify(token, env.jwt.accessSecret);
      if (payload.type !== 'customer') throw new Error('Invalid token type');
      return payload;
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }
  },

  mapCustomer(customer) {
    if (!customer) return null;
    return {
      id: customer.id,
      fullName: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      isGuest: Boolean(customer.is_guest),
    };
  },
};

module.exports = CustomerAuthServiceServer;
