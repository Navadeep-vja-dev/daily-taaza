const { env } = require('./env');
const {
  isMySqlConfigured,
  useMemoryStorage,
  getStorageModeLabel,
  describeDbConfig,
} = require('./database.config');

function isRazorpayConfigured() {
  return Boolean(env.razorpay.keyId && env.razorpay.keySecret);
}

function isWhatsappApiConfigured() {
  return Boolean(env.whatsapp.accessToken && env.whatsapp.phoneNumberId);
}

function isWhatsappLinkConfigured() {
  return Boolean(env.whatsapp.businessPhone);
}

function printStartupBanner({
  port,
  dbConnected,
  memoryMode,
  database,
  tablesVerified,
  seedHint,
}) {
  const db = describeDbConfig();
  const storage = memoryMode ? 'In-Memory' : 'MySQL';
  const razorpay = isRazorpayConfigured() ? 'configured' : 'not configured';
  const whatsappApi = isWhatsappApiConfigured()
    ? 'Meta API configured'
    : isWhatsappLinkConfigured()
      ? 'wa.me links only (no API token)'
      : 'not configured';

  const lines = [
    '',
    '══════════════════════════════════════════════════════',
    '  Daily Taaza — Server Started',
    '══════════════════════════════════════════════════════',
    `  Environment            : ${env.nodeEnv}`,
  ];

  if (memoryMode) {
    lines.push('  Storage                  : In-Memory');
    lines.push(`  Server Port              : ${port}`);
    lines.push(`  URL                      : http://localhost:${port}`);
    lines.push(`  API                      : http://localhost:${port}${env.apiPrefix}`);
  } else {
    lines.push(dbConnected ? '  ✓ MySQL Connected' : '  ✗ MySQL Connection Failed');
    lines.push(`  ✓ Database               : ${database || db.database}`);
    if (tablesVerified === true) {
      lines.push('  ✓ Tables Verified');
    } else if (tablesVerified === false) {
      lines.push('  ✗ Tables Missing         : run npm run db:seed');
    }
    if (seedHint) lines.push(`  ${seedHint}`);
    lines.push(`  ✓ Server Running on Port : ${port}`);
    lines.push(`  Storage                  : ${storage}`);
    lines.push(`  URL                      : http://localhost:${port}`);
    lines.push(`  API                      : http://localhost:${port}${env.apiPrefix}`);
    lines.push(`  MySQL Host               : ${db.host}:${db.port}`);
    lines.push(`  MySQL User               : ${db.user}`);
  }

  lines.push('──────────────────────────────────────────────────────');
  lines.push(`  WhatsApp Integration     : ${whatsappApi}`);
  lines.push(`  Payment Integration      : Razorpay ${razorpay}`);
  lines.push('══════════════════════════════════════════════════════');
  lines.push('');

  console.log(lines.join('\n'));
}

function formatPortInUseError(port) {
  return [
    `Port ${port} is already in use (EADDRINUSE).`,
    '',
    'Another process is listening on this port — often a previous server instance.',
    'Options:',
    `  1. Stop the process using port ${port} (Windows: netstat -ano | findstr :${port}, then taskkill /PID <pid> /F)`,
    `  2. Set a different PORT in your .env file (current: PORT=${port})`,
    '  3. If you started the server twice, close the other terminal or stop the background process.',
  ].join('\n');
}

module.exports = {
  printStartupBanner,
  formatPortInUseError,
  isRazorpayConfigured,
  isWhatsappApiConfigured,
  getStorageModeLabel,
};
