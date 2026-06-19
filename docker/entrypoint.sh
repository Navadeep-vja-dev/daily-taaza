#!/bin/bash
set -e

echo "Waiting for MySQL..."
node scripts/wait-for-mysql.js

echo "Running migrations..."
node sql/migrate.js

echo "Seeding database (idempotent)..."
node sql/seed.js

echo "Starting Daily Taaza server..."
exec node server.js
