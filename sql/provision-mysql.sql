-- Daily Taaza — MySQL provisioning (manual fallback)
--
-- Preferred: npm run db:init
-- This script is for MySQL Workbench when you cannot run db:init.
--
-- IMPORTANT: Replace YOUR_PASSWORD below with the same value as DB_PASSWORD in .env
--            Replace daily_taaza with DB_USER if you changed it.

CREATE DATABASE IF NOT EXISTS daily_taaza
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'daily_taaza'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
CREATE USER IF NOT EXISTS 'daily_taaza'@'127.0.0.1' IDENTIFIED BY 'YOUR_PASSWORD';

GRANT ALL PRIVILEGES ON daily_taaza.* TO 'daily_taaza'@'localhost';
GRANT ALL PRIVILEGES ON daily_taaza.* TO 'daily_taaza'@'127.0.0.1';

FLUSH PRIVILEGES;

SELECT user, host, plugin FROM mysql.user
WHERE user IN ('root', 'daily_taaza')
ORDER BY user, host;

SHOW DATABASES LIKE 'daily_taaza';

-- Then run: npm run db:seed && npm start
