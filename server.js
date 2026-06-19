const app = require('./app');
const db = require('./src/data/mysql/db');
const logger = require('./src/shared/logger');
const { env } = require('./src/shared/config/env');
const { printStartupBanner, formatPortInUseError } = require('./src/shared/config/startup');
const DbConnectionError = require('./src/shared/errors/DbConnectionError');
const { formatShortError } = require('./src/shared/config/database.config');

let server;

function closeServer() {
  return new Promise((resolve, reject) => {
    if (!server) return resolve();
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  try {
    await closeServer();
    await db.disconnect();
    logger.info('Server stopped');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', { error: err.message });
    process.exit(1);
  }
}

async function start() {
  await db.connect();
  const dbStatus = await db.getStartupStatus();

  await new Promise((resolve, reject) => {
    server = app.listen(env.port, () => resolve());
    server.on('error', (err) => reject(err));
  });

  printStartupBanner({
    port: env.port,
    dbConnected: !db.isMemoryMode(),
    memoryMode: db.isMemoryMode(),
    database: dbStatus.database,
    tablesVerified: dbStatus.tablesVerified,
    seedHint:
      dbStatus.tablesVerified === false
        ? '→ Run npm run db:seed to create missing tables'
        : dbStatus.tablesVerified === true
          ? '✓ Seed data ready (run npm run db:seed to refresh)'
          : null,
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n' + formatPortInUseError(env.port) + '\n');
    process.exit(1);
  }
  if (err instanceof DbConnectionError) {
    console.error('\n' + formatShortError(err) + '\n');
    logger.error('Failed to start server', { code: err.code, summary: err.summary });
    process.exit(1);
  }
  console.error('\n' + (err.message || err) + '\n');
  logger.error('Failed to start server', { error: err.message, code: err.code });
  process.exit(1);
});
