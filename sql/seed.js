const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { env } = require('../src/shared/config/env');
const {
  getPoolOptions,
  ensureDatabaseExists,
  prepareSchemaSql,
  formatShortError,
  diagnoseConnection,
  useMemoryStorage,
} = require('../src/shared/config/database.config');
const { PRODUCTS_MOCK } = require('../src/data/mock/products.mock.js');
const { CATEGORY_LABELS_MOCK } = require('../src/data/mock/categories.mock.js');

async function seed() {
  if (useMemoryStorage()) {
    console.error(
      'Seed requires MySQL. Unset DB_USE_MEMORY or set it to false in .env before running db:seed.'
    );
    process.exit(1);
  }

  if (!process.env.DB_HOST || !process.env.DB_NAME) {
    console.error(
      'Database not configured. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in .env before seeding.'
    );
    process.exit(1);
  }

  console.log(`Connecting to MySQL at ${env.db.host}:${env.db.port} as ${env.db.user}...`);

  const authCheck = await diagnoseConnection(getPoolOptions());
  if (!authCheck.ok) {
    console.error('\n' + formatShortError(authCheck) + '\n');
    process.exit(1);
  }

  const ensureResult = await ensureDatabaseExists();
  if (!ensureResult.ok) {
    console.error('\n' + formatShortError(ensureResult.diagnosis) + '\n');
    process.exit(1);
  }
  console.log(`Database "${ensureResult.database}" is ready.`);

  const schemaPath = path.join(__dirname, 'schema.sql');
  const rawSchema = fs.readFileSync(schemaPath, 'utf8');
  const schema = prepareSchemaSql(rawSchema);

  let conn;
  try {
    conn = await mysql.createConnection({
      ...getPoolOptions(),
      multipleStatements: true,
    });
  } catch (err) {
    const diagnosis = await diagnoseConnection(getPoolOptions());
    console.error('\n' + formatShortError(diagnosis) + '\n');
    process.exit(1);
  }

  try {
    await conn.query(schema);
    const { migrate } = require('./migrate');
    await migrate();

    for (const [id, label] of Object.entries(CATEGORY_LABELS_MOCK)) {
      await conn.query(
        'INSERT IGNORE INTO categories (id, label, sort_order) VALUES (?, ?, ?)',
        [id, label, 0]
      );
    }

    for (const p of PRODUCTS_MOCK) {
      await conn.query(
        `INSERT INTO products (id, category_id, name, slug, price, badge, description, ingredients, benefits,
          image, placeholder_color, placeholder_text, stock_qty, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price)`,
        [
          p.id,
          p.category,
          p.name,
          p.id,
          p.price,
          p.badge,
          p.description,
          JSON.stringify(p.ingredients),
          JSON.stringify(p.benefits),
          p.image,
          p.placeholderColor,
          p.placeholderText || null,
          100,
        ]
      );

      await conn.query(
        `INSERT IGNORE INTO product_variants (id, product_id, label, weight_grams, price, stock_qty, is_default, sort_order)
         VALUES (?, ?, '500g', 500, ?, 100, 1, 0)`,
        [`${p.id}-500g`, p.id, p.price]
      );
      await conn.query(
        `INSERT IGNORE INTO product_variants (id, product_id, label, weight_grams, price, stock_qty, is_default, sort_order)
         VALUES (?, ?, '1 kg', 1000, ?, 100, 0, 1)`,
        [`${p.id}-1kg`, p.id, Math.round(p.price * 1.8)]
      );

      const [existingImages] = await conn.query(
        'SELECT id FROM product_images WHERE product_id = ? LIMIT 1',
        [p.id]
      );
      if (!existingImages.length) {
        await conn.query(
          'INSERT INTO product_images (product_id, file_path, alt_text, sort_order, is_primary) VALUES (?, ?, ?, 0, 1)',
          [p.id, p.image, p.name]
        );
      }
    }

    const hash = await bcrypt.hash('Admin@123', 12);
    await conn.query(
      'INSERT IGNORE INTO admin_users (id, email, password_hash, full_name, role_id) VALUES (1, ?, ?, ?, 1)',
      ['admin@dailytaaza.com', hash, 'Daily Taaza Admin']
    );

    console.log('Database seeded successfully.');
    console.log(`  Database : ${env.db.database}`);
    console.log(`  Host     : ${env.db.host}:${env.db.port}`);
    console.log(`  Products : ${PRODUCTS_MOCK.length}`);
    console.log(`  Admin    : admin@dailytaaza.com / Admin@123`);
  } finally {
    await conn.end();
  }
}

seed().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
