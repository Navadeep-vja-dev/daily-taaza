/**
 * First-run MySQL setup: provision user/database from .env, then seed.
 * Usage: npm run db:init
 */
const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');
const { env } = require('../src/shared/config/env');
const {
  diagnoseConnection,
  ensureDatabaseExists,
  verifyTables,
  getPoolOptions,
  formatShortError,
  describeDbConfig,
} = require('../src/shared/config/database.config');
const {
  provisionDatabase,
  connectAsAdmin,
  verifyAppConnection,
} = require('../src/shared/config/provision-database');

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function runSeed() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, '../sql/seed.js')], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`seed exited with code ${code}`))));
    child.on('error', reject);
  });
}

async function tryAppConnection() {
  const diagnosis = await diagnoseConnection(getPoolOptions());
  return diagnosis;
}

async function provisionWithRoot(adminPassword, adminUser = 'root') {
  const conn = await connectAsAdmin(adminUser, adminPassword);
  try {
    await provisionDatabase(conn);
  } finally {
    await conn.end();
  }
}

async function ensureSeeded() {
  let conn;
  try {
    conn = await mysql.createConnection(getPoolOptions());
    const tables = await verifyTables(conn);
    if (tables.ok) {
      console.log(`Tables already present (${tables.existing.length} tables).`);
      return false;
    }
    console.log(`Missing tables: ${tables.missing.join(', ')}`);
    return true;
  } finally {
    if (conn) await conn.end();
  }
}

async function main() {
  const config = describeDbConfig();

  console.log('Daily Taaza — Database Init');
  console.log('===========================');
  console.log(`Target: ${config.user}@${config.host}:${config.port}/${config.database}`);
  console.log('');

  const diagnosis = await tryAppConnection();
  if (!diagnosis.ok) {
    console.log('App credentials not valid yet — provisioning MySQL user and database...');
    console.log('');

    if (!process.stdin.isTTY) {
      console.error('Interactive root password required. Run in a terminal: npm run db:init');
      console.error('\n' + formatShortError(diagnosis) + '\n');
      process.exit(1);
    }

    const rootPassword = await prompt('Enter MySQL root password: ');
    if (!rootPassword) {
      console.error('Root password is required to create the application user.');
      process.exit(1);
    }

    try {
      await provisionWithRoot(rootPassword);
      console.log('Provisioning complete.');
    } catch (err) {
      console.error(`Provisioning failed: ${err.message}`);
      console.error('\nTry MySQL Workbench with sql/provision-mysql.sql');
      process.exit(1);
    }

    try {
      await verifyAppConnection();
      console.log(`Verified ${config.user} can connect.`);
    } catch (err) {
      console.error(`Verification failed: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.log('App credentials OK.');
    const dbResult = await ensureDatabaseExists();
    if (!dbResult.ok) {
      console.error('\n' + formatShortError(dbResult.diagnosis) + '\n');
      process.exit(1);
    }
  }

  const needsSeed = await ensureSeeded();
  if (needsSeed) {
    console.log('');
    console.log('Running seed...');
    await runSeed();
  }

  console.log('');
  console.log('✓ MySQL ready');
  console.log(`✓ Database: ${config.database}`);
  console.log('✓ Run: npm start');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
