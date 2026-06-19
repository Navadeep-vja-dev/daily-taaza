const { diagnoseConnection, getPoolOptions, formatShortError } = require('../src/shared/config/database.config');
const { env } = require('../src/shared/config/env');

const MAX_ATTEMPTS = 30;
const DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Waiting for MySQL at ${env.db.host}:${env.db.port} ...`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await diagnoseConnection(getPoolOptions());
    if (result.ok) {
      console.log('MySQL is ready.');
      process.exit(0);
    }

    const code = result.error?.code || 'UNKNOWN';
    process.stdout.write(`  attempt ${attempt}/${MAX_ATTEMPTS} (${code})...\r`);

    if (code !== 'ECONNREFUSED' && code !== 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n' + formatShortError(result));
      process.exit(1);
    }

    await sleep(DELAY_MS);
  }

  console.error('\nTimed out waiting for MySQL. Run: npm run db:up');
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
