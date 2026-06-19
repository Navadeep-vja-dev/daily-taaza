const express = require('express');
const rateLimit = require('express-rate-limit');const { env } = require('../shared/config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler.middleware');

function createApiApp() {
  const router = express.Router();

  router.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: env.nodeEnv === 'production' ? 100 : 500,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
  router.use('/admin/auth/login', authLimiter);

  router.use(apiRoutes);
  router.use(errorHandler);

  return router;
}

module.exports = { createApiApp };