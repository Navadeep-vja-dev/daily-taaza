/**
 * Drops every table in the configured database so the schema can be rebuilt
 * from scratch. Destructive — intended for development resets only.
 */
const mysql = require('mysql2/promise');
const { env } = require('../src/shared/config/env');
const { getPoolOptions, useMemoryStorage } = require('../src/shared/config/database.config');

async function reset() {
  if (useMemoryStorage()) {
    console.log('Reset skipped (DB_USE_MEMORY=true)');
    return;
  }

  const conn = await mysql.createConnection({ ...getPoolOptions(), multipleStatements: true });
  try {
    const [tables] = await conn.query(
      'SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ?',
      [env.db.database]
    );
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const row of tables) {
      await conn.query('DROP TABLE IF EXISTS `' + row.t + '`');
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`Dropped ${tables.length} table(s) from ${env.db.database}.`);
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  reset().catch((err) => {
    console.error('Reset failed:', err.message);
    process.exit(1);
  });
}

module.exports = { reset };
