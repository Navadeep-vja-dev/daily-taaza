/**
 * Full MySQL diagnosis — answers install, service, port, auth, and database checks.
 * Usage: npm run db:check
 */
const { execSync } = require('child_process');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { env } = require('../src/shared/config/env');
const {
  diagnoseConnection,
  ensureDatabaseExists,
  verifyTables,
  useMemoryStorage,
  describeDbConfig,
  getPoolOptions,
  scanLocalMysqlPorts,
} = require('../src/shared/config/database.config');

function section(title) {
  console.log('');
  console.log(`── ${title} ${'─'.repeat(Math.max(0, 52 - title.length))}`);
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  console.log(`  ✗ ${msg}`);
}

function info(msg) {
  console.log(`  · ${msg}`);
}

function getWindowsMysqlServices() {
  try {
    const out = execSync('powershell -NoProfile -Command "Get-Service *mysql* | Select-Object Name,Status | Format-Table -HideTableHeaders"', {
      encoding: 'utf8',
    });
    return out
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\s+/);
        return { name: parts[0], status: parts[1] };
      });
  } catch {
    return [];
  }
}

async function main() {
  if (useMemoryStorage()) {
    console.log('DB_USE_MEMORY=true — MySQL check skipped (in-memory mode).');
    process.exit(0);
  }

  const config = describeDbConfig();

  console.log('Daily Taaza — MySQL Doctor');
  console.log('==========================');

  section('1. MySQL Server');
  const services = getWindowsMysqlServices();
  if (services.length === 0) {
    fail('No MySQL Windows services found');
    info('Install MySQL or start Docker Desktop and use DB_PORT=3307 with npm run db:setup');
  } else {
    ok('MySQL is installed');
    for (const svc of services) {
      info(`${svc.name}: ${svc.status}`);
    }
  }

  const openPorts = await scanLocalMysqlPorts('127.0.0.1');
  if (openPorts.includes(config.port)) {
    ok(`Port ${config.port} is active and accepting TCP connections`);
  } else {
    fail(`Port ${config.port} is not listening`);
    info(`Open MySQL ports detected: ${openPorts.join(', ') || 'none'}`);
    if (openPorts.includes(330) && config.port === 3306) {
      info('MySQL 8.0 is on port 330; MySQL 9.7 is on port 3306 — verify DB_PORT in .env');
    }
  }

  section('2. Application Configuration (.env)');
  const envPath = path.resolve(__dirname, '../.env');
  ok(`dotenv loaded from ${fs.existsSync(envPath) ? envPath : '(missing — using process env)'}`);
  info(`DB_HOST=${config.host}`);
  info(`DB_PORT=${config.port}`);
  info(`DB_USER=${config.user}`);
  info(`DB_PASSWORD=${config.passwordSet ? `(set, ${config.passwordLength} characters)` : '(empty)'}`);
  info(`DB_NAME=${config.database}`);

  section('3. Authentication');
  const diagnosis = await diagnoseConnection(getPoolOptions());
  if (!diagnosis.ok) {
    fail('Application cannot authenticate to MySQL');
    info(diagnosis.cause);
    if (diagnosis.dockerHint?.worksOnDockerPort) {
      console.log('');
      fail(`Credentials work on Docker MySQL port ${diagnosis.dockerHint.dockerPort} but .env uses port ${config.port}`);
    }
    console.log('');
    console.log('Suggested fixes:');
    diagnosis.fixes.forEach((fix, i) => console.log(`  ${i + 1}. ${fix}`));
    if (diagnosis.openPorts?.length > 1) {
      console.log('');
      info(`Open MySQL ports: ${diagnosis.openPorts.join(', ')}`);
    }
    process.exit(1);
  }

  ok(`User "${config.user}" authenticated successfully`);
  ok('Authentication plugin compatible (connection handshake succeeded)');

  section('4. Database & Tables');
  const dbResult = await ensureDatabaseExists();
  if (!dbResult.ok) {
    fail(dbResult.diagnosis?.cause || 'Database setup failed');
    if (dbResult.diagnosis?.fixes?.length) {
      console.log('');
      dbResult.diagnosis.fixes.forEach((fix, i) => console.log(`  ${i + 1}. ${fix}`));
    }
    process.exit(1);
  }
  ok(`Database "${dbResult.database}" exists`);

  let conn;
  try {
    conn = await mysql.createConnection(getPoolOptions());
    const tables = await verifyTables(conn);
    if (tables.ok) {
      ok(`Tables verified (${tables.existing.length} tables present)`);
    } else {
      fail(`Missing tables: ${tables.missing.join(', ')}`);
      info('Run: npm run db:seed');
    }
  } finally {
    if (conn) await conn.end();
  }

  section('5. Summary');
  ok('MySQL Connected');
  ok(`Database: ${config.database}`);
  ok('Credentials valid');
  console.log('');
  console.log('Next: npm run db:seed  (if tables missing)  →  npm start');
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
