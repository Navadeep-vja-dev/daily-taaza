const { loadEnv } = require('./loadEnv');

loadEnv();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3456,
  apiPrefix: '/api',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'daily_taaza',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'daily_taaza',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessPhone: process.env.WHATSAPP_BUSINESS_PHONE || '919876543210',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSizeMb: parseInt(process.env.UPLOAD_MAX_MB, 10) || 5,
    maxImagesPerProduct: parseInt(process.env.PRODUCT_MAX_IMAGES, 10) || 10,
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

function isDbConfigured() {
  const memoryOff = process.env.DB_USE_MEMORY !== 'true' && process.env.DB_USE_MEMORY !== '1';
  return Boolean(process.env.DB_HOST && process.env.DB_NAME && memoryOff);
}

module.exports = { env, isDbConfigured };
