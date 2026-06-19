/**
 * Provisions MySQL user + database for Daily Taaza.
 *
 * Usage:
 *   npm run db:provision
 *   npm run db:provision -- --admin-password YOUR_ROOT_PASSWORD
 *   npm run db:provision -- --reset-root
 */
const readline = require('readline');
const { env } = require('../src/shared/config/env');
const { describeDbConfig, formatShortError, diagnoseConnection } = require('../src/shared/config/database.config');
const {
  provisionDatabase,
  connectAsAdmin,
  verifyAppConnection,
} = require('../src/shared/config/provision-database');

function parseArgs(argv) {
  const args = { adminPassword: null, resetRoot: false, adminUser: 'root' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--admin-password' && argv[i + 1]) {
      args.adminPassword = argv[++i];
    } else if (argv[i] === '--admin-user' && argv[i + 1]) {
      args.adminUser = argv[++i];
    } else if (argv[i] === '--reset-root') {
      args.resetRoot = true;
    }
  }
  return args;
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function printAdminFallback() {
  console.log('');
  console.log('Could not connect as MySQL admin. Options:');
  console.log('  1. npm run db:init — interactive setup (recommended)');
  console.log('  2. MySQL Workbench → run sql/provision-mysql.sql');
  console.log('  3. PowerShell as Admin → .\\scripts\\mysql-provision-admin.ps1');
}

async function main() {
  const args = parseArgs(process.argv);
  const config = describeDbConfig();

  console.log('Daily Taaza — MySQL Provisioning');
  console.log('================================');
  console.log(`Target server : ${config.host}:${config.port}`);
  console.log(`Database      : ${config.database}`);
  console.log(`App user      : ${config.user}`);
  console.log('');

  let adminPassword = args.adminPassword;
  if (!adminPassword && process.stdin.isTTY) {
    adminPassword = await prompt(
      `Enter MySQL admin password for user "${args.adminUser}" (required): `
    );
  }

  if (!adminPassword) {
    console.error('Admin password is required. Use --admin-password or run npm run db:init');
    process.exit(1);
  }

  let adminConn;
  try {
    adminConn = await connectAsAdmin(args.adminUser, adminPassword);
    console.log(`Connected as ${args.adminUser}. Provisioning...`);
    await provisionDatabase(adminConn, { resetRoot: args.resetRoot });
    await adminConn.end();
    console.log('Provisioning complete.');
  } catch (err) {
    if (adminConn) await adminConn.end().catch(() => {});
    console.error(`Admin connection failed: ${err.message}`);
    const diagnosis = await diagnoseConnection();
    if (!diagnosis.ok) {
      console.error('\n' + formatShortError(diagnosis) + '\n');
    }
    printAdminFallback();
    process.exit(1);
  }

  try {
    await verifyAppConnection();
    console.log(`Verified app user "${config.user}" can connect to "${config.database}".`);
  } catch (err) {
    console.error(`App user verification failed: ${err.message}`);
    process.exit(1);
  }

  console.log('');
  console.log('Next: npm run db:seed && npm start');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
