const net = require('net');
const mysql = require('mysql2/promise');
const { env } = require('./env');

function isTruthy(value) {
  return value === true || value === 'true' || value === '1';
}

function useMemoryStorage() {
  return isTruthy(process.env.DB_USE_MEMORY);
}

function isMySqlConfigured() {
  return Boolean(process.env.DB_HOST && process.env.DB_NAME) && !useMemoryStorage();
}

function getPoolOptions(overrides = {}) {
  return {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 10000,
    ...overrides,
  };
}

function getServerConnectionOptions(overrides = {}) {
  return {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
    connectTimeout: 10000,
    ...overrides,
  };
}

function getStorageModeLabel() {
  if (useMemoryStorage()) return 'in-memory';
  if (isMySqlConfigured()) return 'mysql';
  return 'in-memory';
}

function describeDbConfig() {
  return {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    database: env.db.database,
    passwordSet: Boolean(process.env.DB_PASSWORD),
    passwordLength: env.db.password.length,
  };
}

const COMMON_MYSQL_PORTS = [3306, 3307, 3308, 330];

function probeTcp(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: timeoutMs });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.on('connect', () => done(true));
    socket.on('error', () => done(false));
    socket.on('timeout', () => done(false));
  });
}

async function scanLocalMysqlPorts(host = '127.0.0.1') {
  const open = [];
  for (const port of COMMON_MYSQL_PORTS) {
    if (await probeTcp(host, port)) open.push(port);
  }
  return open;
}

async function probeServerWithoutAuth(options) {
  let conn;
  try {
    conn = await mysql.createConnection({ ...options, connectTimeout: 5000 });
    await conn.query('SELECT 1');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  } finally {
    if (conn) await conn.end();
  }
}

const { execSync } = require('child_process');

function isDockerMysqlRunning() {
  try {
    const out = execSync('docker ps --filter name=daily-taaza-mysql --format "{{.Names}}"', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return out.includes('daily-taaza-mysql');
  } catch {
    return false;
  }
}

async function probeCredentials(host, port, user, password, database) {
  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 5000,
    });
    await conn.query('SELECT 1');
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  } finally {
    if (conn) await conn.end();
  }
}

function buildFixes(error, config, openPorts, dockerHint) {
  if (dockerHint?.worksOnDockerPort) {
    return [
      `Set DB_PORT=${dockerHint.dockerPort} in .env — your app user exists on Docker MySQL, not on local MySQL ${config.port}`,
      'Ensure Docker is running: npm run docker:up',
      'Or provision local MySQL: npm run db:init (creates daily_taaza on port 3306)',
    ];
  }
  if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
    const fixes = [
      'User may not exist on this MySQL instance — run: npm run db:init',
      'If using Docker MySQL, set DB_PORT=3307 and run: npm run docker:up',
    ];
    if (config.port === 3306 && openPorts.includes(330)) {
      fixes.push('Ensure DB_PORT=3306 targets MySQL 9.7 (MySQL 8.0 uses port 330)');
    }
    if (config.port === 3307) {
      fixes.push('Start Docker MySQL: npm run db:up');
    }
    fixes.push('npm run db:check — full diagnosis');
    return fixes;
  }
  if (error?.code === 'ECONNREFUSED') {
    return [
      'Start MySQL service (MySQL97 or MySQL80)',
      `Verify DB_PORT matches an open port (${openPorts.join(', ') || 'none detected'})`,
      'npm run db:check — full diagnosis',
    ];
  }
  if (error?.code === 'ER_BAD_DB_ERROR') {
    return ['npm run db:init', 'npm run db:seed'];
  }
  if (error?.code === 'ENOTFOUND') {
    return [`Check DB_HOST in .env (current: ${config.host})`];
  }
  return ['npm run db:check — full diagnosis'];
}

function buildCause(error, config, tcpReachable, dockerHint) {
  if (dockerHint?.worksOnDockerPort) {
    return (
      `User "${config.user}" is not provisioned on local MySQL at ${config.host}:${config.port}, ` +
      `but credentials work on Docker MySQL at ${config.host}:${dockerHint.dockerPort}. ` +
      `Your .env DB_PORT points to the wrong MySQL instance.`
    );
  }
  if (!tcpReachable) {
    return `No MySQL server is listening on ${config.host}:${config.port}.`;
  }
  if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
    return `User ${config.user}@${config.host}:${config.port} — access denied (user may not exist or password is wrong).`;
  }
  if (error?.code === 'ECONNREFUSED') {
    return `Cannot connect to ${config.host}:${config.port}.`;
  }
  if (error?.code === 'ER_BAD_DB_ERROR') {
    return `Database "${config.database}" does not exist on the server.`;
  }
  if (error?.code === 'ENOTFOUND') {
    return `Host "${config.host}" could not be resolved.`;
  }
  return error?.message || 'MySQL connection failed.';
}

function buildSummary(error, config) {
  const code = error?.code ? ` (${error.code})` : '';
  if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
    return `Access denied for ${config.user}@${config.host}:${config.port}${code}`;
  }
  if (error?.code === 'ECONNREFUSED') {
    return `MySQL unreachable at ${config.host}:${config.port}${code}`;
  }
  if (error?.code === 'ER_BAD_DB_ERROR') {
    return `Database "${config.database}" not found${code}`;
  }
  return `MySQL connection failed${code}`;
}

function buildVerboseReport(context) {
  const lines = [];
  const { config, tcpReachable, openPorts, error, cause } = context;

  lines.push(`Cause: ${cause}`);
  lines.push('');
  lines.push('Configuration (.env):');
  lines.push(`  DB_HOST=${config.host}`);
  lines.push(`  DB_PORT=${config.port}`);
  lines.push(`  DB_USER=${config.user}`);
  lines.push(`  DB_PASSWORD=${config.passwordSet ? `(set, ${config.passwordLength} characters)` : '(empty)'}`);
  lines.push(`  DB_NAME=${config.database}`);
  lines.push('');
  lines.push('MySQL server:');
  lines.push(`  TCP reachable at ${config.host}:${config.port}: ${tcpReachable ? 'yes' : 'no'}`);
  if (openPorts.length > 0) {
    lines.push(`  Open ports on this machine: ${openPorts.join(', ')}`);
  }
  if (openPorts.length > 1) {
    lines.push('  Note: Multiple MySQL instances detected (8.0 often uses 330, 9.7 uses 3306).');
  }
  if (error?.message) {
    lines.push('');
    lines.push(`Server message: ${error.message}`);
  }
  return lines.join('\n');
}

function buildDiagnosisResult(context) {
  const { config, tcpReachable, openPorts, error, dockerHint } = context;
  const cause = buildCause(error, config, tcpReachable, dockerHint);
  const summary = buildSummary(error, config);
  const fixes = buildFixes(error, config, openPorts, dockerHint);

  return {
    ok: false,
    error,
    code: error?.code,
    summary,
    cause,
    fixes,
    verbose: buildVerboseReport({ ...context, cause }),
    openPorts,
    config,
    tcpReachable,
    dockerHint: dockerHint || null,
  };
}

function formatShortError(diagnosis) {
  const lines = [
    `✗ ${diagnosis.summary}`,
    `  ${diagnosis.cause}`,
    '',
    '  Fix:',
    ...diagnosis.fixes.map((f) => `    ${f}`),
    '',
    '  Full diagnosis: npm run db:check',
  ];
  return lines.join('\n');
}

function formatVerboseError(diagnosis) {
  const lines = [
    diagnosis.cause,
    '',
    'Suggested fixes:',
    ...diagnosis.fixes.map((f, i) => `  ${i + 1}. ${f}`),
    '',
    diagnosis.verbose,
  ];
  return lines.join('\n');
}

async function diagnoseConnection(options = getPoolOptions()) {
  const config = describeDbConfig();
  const host = options.host || config.host;
  const port = options.port || config.port;
  const dockerPort = parseInt(process.env.DB_DOCKER_PORT, 10) || 3307;

  const tcpReachable = await probeTcp(host, port);
  const openPorts = await scanLocalMysqlPorts('127.0.0.1');

  if (!tcpReachable) {
    const error = { code: 'ECONNREFUSED', message: `connect ECONNREFUSED ${host}:${port}` };
    return buildDiagnosisResult({ config, tcpReachable, openPorts, error });
  }

  const authWithPassword = await probeCredentials(
    host,
    port,
    options.user || config.user,
    options.password ?? env.db.password,
    options.database
  );

  if (authWithPassword.ok) {
    return { ok: true, openPorts };
  }

  let dockerHint = null;
  if (
    authWithPassword.error?.code === 'ER_ACCESS_DENIED_ERROR' &&
    port !== dockerPort &&
    openPorts.includes(dockerPort) &&
    isDockerMysqlRunning()
  ) {
    const dockerAuth = await probeCredentials(
      host,
      dockerPort,
      options.user || config.user,
      options.password ?? env.db.password,
      options.database
    );
    if (dockerAuth.ok) {
      dockerHint = { worksOnDockerPort: true, dockerPort };
    }
  }

  return buildDiagnosisResult({
    config,
    tcpReachable,
    openPorts,
    error: authWithPassword.error,
    dockerHint,
  });
}

function formatDbConnectionError(err) {
  const config = describeDbConfig();
  const diagnosis = buildDiagnosisResult({
    config,
    tcpReachable: err.code !== 'ECONNREFUSED',
    openPorts: [],
    error: err,
  });
  return formatShortError(diagnosis);
}

async function testConnection(options = getPoolOptions()) {
  const diagnosis = await diagnoseConnection(options);
  if (diagnosis.ok) return { ok: true, openPorts: diagnosis.openPorts };
  return { ok: false, error: diagnosis.error, diagnosis };
}

async function ensureDatabaseExists(overrides = {}) {
  const dbName = env.db.database;
  let conn;
  try {
    conn = await mysql.createConnection(getServerConnectionOptions(overrides));
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    return { ok: true, database: dbName };
  } catch (err) {
    const diagnosis = await diagnoseConnection(getServerConnectionOptions(overrides));
    return { ok: false, error: err, diagnosis };
  } finally {
    if (conn) await conn.end();
  }
}

const REQUIRED_TABLES = [
  'categories',
  'products',
  'product_variants',
  'product_images',
  'customers',
  'orders',
  'order_items',
  'admin_users',
  'cart_sessions',
  'cart_items',
];

async function verifyTables(connection) {
  const dbName = env.db.database.replace(/`/g, '');
  const [rows] = await connection.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
    [dbName]
  );
  const existing = new Set(rows.map((r) => r.TABLE_NAME));
  const missing = REQUIRED_TABLES.filter((t) => !existing.has(t));
  return { ok: missing.length === 0, existing: [...existing], missing };
}

function prepareSchemaSql(rawSchema) {
  const dbName = env.db.database.replace(/`/g, '');
  return rawSchema
    .replace(/CREATE DATABASE IF NOT EXISTS\s+\w+/i, `CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    .replace(/USE\s+\w+\s*;/i, `USE \`${dbName}\`;`);
}

module.exports = {
  useMemoryStorage,
  isMySqlConfigured,
  getPoolOptions,
  getServerConnectionOptions,
  getStorageModeLabel,
  describeDbConfig,
  formatDbConnectionError,
  formatShortError,
  formatVerboseError,
  diagnoseConnection,
  testConnection,
  ensureDatabaseExists,
  verifyTables,
  prepareSchemaSql,
  scanLocalMysqlPorts,
  REQUIRED_TABLES,
};
