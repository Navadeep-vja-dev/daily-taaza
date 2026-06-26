const mysql = require('mysql2/promise');
const { env } = require('../../shared/config/env');
const {
  isMySqlConfigured,
  useMemoryStorage,
  getPoolOptions,
  diagnoseConnection,
  verifyTables,
} = require('../../shared/config/database.config');
const DbConnectionError = require('../../shared/errors/DbConnectionError');
const logger = require('../../shared/logger');

let pool = null;
let memoryMode = false;

const memory = {
  categories: [],
  products: [],
  productVariants: [],
  productImages: [],
  cartSessions: new Map(),
  cartItems: new Map(),
  customers: [],
  customerAddresses: [],
  orders: [],
  orderItems: [],
  contactMessages: [],
  newsletter: [],
  adminUsers: [],
  settings: {},
  payments: [],
  whatsappLogs: [],
  nextId: 1,
};

function seedVariantsForProduct(p) {
  return [
    {
      id: `${p.id}-500g`,
      product_id: p.id,
      label: '500g',
      weight_grams: 500,
      price: p.price,
      compare_price: null,
      stock_qty: 100,
      is_default: 1,
      sort_order: 0,
    },
    {
      id: `${p.id}-1kg`,
      product_id: p.id,
      label: '1 kg',
      weight_grams: 1000,
      price: Math.round(p.price * 1.8),
      compare_price: null,
      stock_qty: 100,
      is_default: 0,
      sort_order: 1,
    },
  ];
}

function loadMockData() {
  const { PRODUCTS_MOCK } = require('../mock/products.mock.js');
  const { CATEGORY_LABELS_MOCK } = require('../mock/categories.mock.js');
  const categoryIdBySlug = {};
  memory.categories = Object.entries(CATEGORY_LABELS_MOCK).map(([slug, label], i) => {
    const id = i + 1;
    categoryIdBySlug[slug] = id;
    return { id, label, is_active: 1 };
  });
  const formatProductId = (n) => `P-${String(n).padStart(6, '0')}`;
  memory.products = PRODUCTS_MOCK.map((p, i) => ({
    id: formatProductId(i + 1),
    category_id: categoryIdBySlug[p.category],
    name: p.name,
    slug: p.id,
    price: p.price,
    badge: p.badge,
    description: p.description,
    ingredients: JSON.stringify(p.ingredients),
    benefits: JSON.stringify(p.benefits),
    image: p.image,
    placeholder_color: p.placeholderColor,
    placeholder_text: p.placeholderText || null,
    stock_qty: 100,
    is_active: 1,
  }));
  memory.sequences = { product: PRODUCTS_MOCK.length + 1, order: 1 };
  memory.productVariants = memory.products.flatMap((p) => seedVariantsForProduct(p));
  memory.productImages = memory.products.map((p) => ({
    id: memory.nextId++,
    product_id: p.id,
    file_path: p.image,
    alt_text: p.name,
    sort_order: 0,
    is_primary: 1,
  }));
}

async function connectMemoryMode(reason) {
  memoryMode = true;
  loadMockData();
  const AdminMysql = require('./admin.mysql');
  await AdminMysql.seedDefaultAdmin();
  logger.warn(reason);
  return null;
}

async function connect() {
  if (pool) return pool;

  if (useMemoryStorage()) {
    return connectMemoryMode('Using in-memory store (DB_USE_MEMORY=true)');
  }

  if (!isMySqlConfigured()) {
    return connectMemoryMode(
      'MySQL not configured — set DB_HOST and DB_NAME in .env to use MySQL, or set DB_USE_MEMORY=true for in-memory mode'
    );
  }

  try {
    pool = mysql.createPool(getPoolOptions());
    await pool.query('SELECT 1');
    memoryMode = false;
    logger.info('MySQL connected', { database: env.db.database });
    const AdminMysql = require('./admin.mysql');
    await AdminMysql.seedDefaultAdmin();
    return pool;
  } catch (err) {
    const diagnosis = await diagnoseConnection(getPoolOptions());
    logger.error('MySQL connection failed', {
      code: diagnosis.code || err.code,
      summary: diagnosis.summary,
      database: env.db.database,
    });
    throw DbConnectionError.fromDiagnosis(diagnosis);
  }
}

async function getStartupStatus() {
  if (memoryMode || !pool) {
    return { connected: false, tablesVerified: null, database: env.db.database };
  }
  const conn = await pool.getConnection();
  try {
    const tables = await verifyTables(conn);
    return {
      connected: true,
      tablesVerified: tables.ok,
      database: env.db.database,
      missingTables: tables.missing,
    };
  } finally {
    conn.release();
  }
}

async function disconnect() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

async function query(sql, params = []) {
  if (memoryMode) throw new Error('SQL query not available in memory mode');
  const db = pool || (await connect());
  if (!db) throw new Error('Database not connected');
  return db.query(sql, params);
}

function isMemoryMode() {
  return memoryMode;
}

function getMemory() {
  return memory;
}

function nextId() {
  return memory.nextId++;
}

async function getConnection() {
  if (memoryMode) return null;
  const db = pool || (await connect());
  if (!db) return null;
  return db.getConnection();
}

module.exports = {
  connect,
  disconnect,
  query,
  getConnection,
  isMemoryMode,
  getMemory,
  nextId,
  loadMockData,
  getStartupStatus,
};
