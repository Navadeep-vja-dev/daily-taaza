/**
 * Idempotent schema migrations for existing databases.
 */
const mysql = require('mysql2/promise');
const { env } = require('../src/shared/config/env');
const { getPoolOptions, useMemoryStorage } = require('../src/shared/config/database.config');

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [env.db.database, table, column]
  );
  return rows.length > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
    [env.db.database, table]
  );
  return rows.length > 0;
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [env.db.database, table, indexName]
  );
  return rows.length > 0;
}

async function migrate() {
  if (useMemoryStorage()) {
    console.log('Migration skipped (DB_USE_MEMORY=true)');
    return;
  }

  const conn = await mysql.createConnection({ ...getPoolOptions(), multipleStatements: true });

  try {
    if (!(await tableExists(conn, 'product_variants'))) {
      await conn.query(`
        CREATE TABLE product_variants (
          id VARCHAR(100) PRIMARY KEY,
          product_id VARCHAR(100) NOT NULL,
          label VARCHAR(50) NOT NULL,
          weight_grams INT NULL,
          price DECIMAL(10, 2) NOT NULL,
          compare_price DECIMAL(10, 2) NULL,
          stock_qty INT NOT NULL DEFAULT 100,
          is_default TINYINT(1) NOT NULL DEFAULT 0,
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          INDEX idx_variants_product (product_id)
        )
      `);
      console.log('Created product_variants table');
    }

    if (!(await indexExists(conn, 'customers', 'uq_customers_phone'))) {
      try {
        await conn.query('ALTER TABLE customers ADD UNIQUE KEY uq_customers_phone (phone)');
        console.log('Added unique index on customers.phone');
      } catch (err) {
        if (err.code !== 'ER_DUP_KEYNAME') console.warn('customers phone index:', err.message);
      }
    }

    if (await tableExists(conn, 'cart_items') && !(await columnExists(conn, 'cart_items', 'variant_id'))) {
      await conn.query('ALTER TABLE cart_items ADD COLUMN variant_id VARCHAR(100) NULL AFTER product_id');
      const [products] = await conn.query('SELECT id, price, stock_qty FROM products');
      for (const p of products) {
        const variantId = `${p.id}-500g`;
        await conn.query(
          `INSERT IGNORE INTO product_variants (id, product_id, label, weight_grams, price, stock_qty, is_default, sort_order)
           VALUES (?, ?, '500g', 500, ?, ?, 1, 0)`,
          [variantId, p.id, p.price, p.stock_qty]
        );
        const variant1kg = `${p.id}-1kg`;
        await conn.query(
          `INSERT IGNORE INTO product_variants (id, product_id, label, weight_grams, price, stock_qty, is_default, sort_order)
           VALUES (?, ?, '1 kg', 1000, ?, ?, 0, 1)`,
          [variant1kg, p.id, Math.round(p.price * 1.8), p.stock_qty]
        );
      }
      await conn.query(`
        UPDATE cart_items ci
        JOIN product_variants pv ON pv.product_id = ci.product_id AND pv.is_default = 1
        SET ci.variant_id = pv.id
        WHERE ci.variant_id IS NULL
      `);
      await conn.query('ALTER TABLE cart_items MODIFY variant_id VARCHAR(100) NOT NULL');
      try {
        await conn.query('ALTER TABLE cart_items DROP INDEX uq_cart_product');
      } catch {
        /* may not exist */
      }
      try {
        await conn.query('ALTER TABLE cart_items ADD UNIQUE KEY uq_cart_variant (cart_session_id, variant_id)');
      } catch (err) {
        if (err.code !== 'ER_DUP_KEYNAME') throw err;
      }
      try {
        await conn.query(
          'ALTER TABLE cart_items ADD CONSTRAINT fk_cart_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)'
        );
      } catch (err) {
        if (err.code !== 'ER_DUP_KEYNAME' && err.code !== 'ER_CANT_CREATE_TABLE') {
          /* FK may already exist */
        }
      }
      console.log('Migrated cart_items.variant_id');
    }

    if (await tableExists(conn, 'order_items') && !(await columnExists(conn, 'order_items', 'variant_id'))) {
      await conn.query(
        'ALTER TABLE order_items ADD COLUMN variant_id VARCHAR(100) NULL AFTER product_id, ADD COLUMN variant_label VARCHAR(50) NULL AFTER variant_id'
      );
      console.log('Added order_items variant columns');
    }

    const [orphanProducts] = await conn.query(
      `SELECT p.id, p.price, p.stock_qty FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       WHERE pv.id IS NULL`
    );
    for (const p of orphanProducts) {
      const variantId = `${p.id}-500g`;
      await conn.query(
        `INSERT IGNORE INTO product_variants (id, product_id, label, weight_grams, price, stock_qty, is_default, sort_order)
         VALUES (?, ?, '500g', 500, ?, ?, 1, 0)`,
        [variantId, p.id, p.price, p.stock_qty]
      );
      await conn.query(
        `INSERT IGNORE INTO product_variants (id, product_id, label, weight_grams, price, stock_qty, is_default, sort_order)
         VALUES (?, ?, '1 kg', 1000, ?, ?, 0, 1)`,
        [`${p.id}-1kg`, p.id, Math.round(p.price * 1.8), p.stock_qty]
      );
    }
    if (orphanProducts.length) {
      console.log(`Backfilled variants for ${orphanProducts.length} products`);
    }

    const [orphanImages] = await conn.query(
      `SELECT p.id, p.image FROM products p
       LEFT JOIN product_images pi ON pi.product_id = p.id
       WHERE pi.id IS NULL`
    );
    for (const p of orphanImages) {
      await conn.query(
        'INSERT INTO product_images (product_id, file_path, sort_order, is_primary) VALUES (?, ?, 0, 1)',
        [p.id, p.image]
      );
    }
    if (orphanImages.length) {
      console.log(`Backfilled primary images for ${orphanImages.length} products`);
    }

    console.log('Migration complete.');
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
}

module.exports = { migrate };
