const path = require('path');
const fs = require('fs');

let loaded = false;

/**
 * Load .env from the project root exactly once.
 * All entry points should require env.js (which calls this) — not dotenv directly.
 */
function loadEnv() {
  if (loaded) return { path: null, parsed: false };

  const projectRoot = path.resolve(__dirname, '../../..');
  const envPath = path.join(projectRoot, '.env');
  const result = require('dotenv').config({ path: envPath });
  loaded = true;

  if (result.error && process.env.NODE_ENV !== 'test') {
    const exists = fs.existsSync(envPath);
    if (!exists) {
      console.warn(
        `[config] No .env file at ${envPath}. Copy .env.example to .env and configure your settings.`
      );
    }
  }

  return { path: envPath, parsed: !result.error };
}

module.exports = { loadEnv };
