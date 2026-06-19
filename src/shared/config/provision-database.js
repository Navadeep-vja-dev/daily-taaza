const mysql = require('mysql2/promise');
const { env } = require('./env');
const { getServerConnectionOptions } = require('./database.config');

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''");
}

/**
 * Create database + app user using credentials from .env.
 * @param {import('mysql2/promise').Connection} conn — admin connection (e.g. root)
 */
async function provisionDatabase(conn, options = {}) {
  const dbName = (options.database || env.db.database).replace(/`/g, '');
  const appUser = options.user || env.db.user;
  const appPassword = escapeSqlString(options.password ?? env.db.password);

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  await conn.query(
    `CREATE USER IF NOT EXISTS '${appUser}'@'localhost' IDENTIFIED BY '${appPassword}'`
  );
  await conn.query(
    `CREATE USER IF NOT EXISTS '${appUser}'@'127.0.0.1' IDENTIFIED BY '${appPassword}'`
  );

  await conn.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${appUser}'@'localhost'`);
  await conn.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${appUser}'@'127.0.0.1'`);

  if (options.resetRoot) {
    await conn.query(`ALTER USER 'root'@'localhost' IDENTIFIED BY '${appPassword}'`);
    await conn.query(`ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY '${appPassword}'`);
  }

  await conn.query('FLUSH PRIVILEGES');
}

async function connectAsAdmin(adminUser, adminPassword) {
  return mysql.createConnection({
    ...getServerConnectionOptions({ user: adminUser, password: adminPassword }),
  });
}

async function verifyAppConnection(options = {}) {
  const conn = await mysql.createConnection({
    host: options.host || env.db.host,
    port: options.port || env.db.port,
    user: options.user || env.db.user,
    password: options.password ?? env.db.password,
    database: options.database || env.db.database,
  });
  await conn.query('SELECT 1');
  await conn.end();
}

module.exports = {
  provisionDatabase,
  connectAsAdmin,
  verifyAppConnection,
};
