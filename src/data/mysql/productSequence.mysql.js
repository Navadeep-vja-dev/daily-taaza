const db = require('./db');

const SEQUENCE_NAME = 'product';
const ID_PREFIX = 'P-';
const ID_PAD = 6;

function formatProductId(sequenceNumber) {
  return `${ID_PREFIX}${String(sequenceNumber).padStart(ID_PAD, '0')}`;
}

function parseProductSequenceId(id) {
  if (!id || !id.startsWith(ID_PREFIX)) return null;
  const n = parseInt(id.slice(ID_PREFIX.length), 10);
  return Number.isFinite(n) ? n : null;
}

const ProductSequenceMysql = {
  formatProductId,
  parseProductSequenceId,

  /**
   * Highest numeric product id currently in the catalog (0 when none).
   * Only `P-XXXXXX` ids are considered; legacy slug ids are ignored.
   */
  async getMaxProductNumber(queryFn = null) {
    if (db.isMemoryMode()) {
      const nums = (db.getMemory().products || [])
        .map((p) => parseProductSequenceId(p.id))
        .filter((n) => n != null);
      return nums.length ? Math.max(...nums) : 0;
    }
    const run = queryFn || db.query;
    const [rows] = await run("SELECT id FROM products WHERE id LIKE 'P-%'");
    let max = 0;
    for (const row of rows) {
      const n = parseProductSequenceId(row.id);
      if (n != null && n > max) max = n;
    }
    return max;
  },

  /**
   * Non-consuming preview of the next product id (max existing + 1).
   * Idempotent: opening/closing the new-product form repeatedly returns
   * the same id until a product is actually created.
   */
  async peekNextProductId() {
    const max = await this.getMaxProductNumber();
    return formatProductId(max + 1);
  },

  /**
   * Authoritative next product id (max existing + 1), serialized via a row
   * lock so concurrent creates do not derive the same value.
   */
  async getNextProductId() {
    if (db.isMemoryMode()) {
      const max = await this.getMaxProductNumber();
      return formatProductId(max + 1);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        'INSERT INTO id_sequences (name, next_val) VALUES (?, 1) ON DUPLICATE KEY UPDATE next_val = next_val',
        [SEQUENCE_NAME]
      );
      await conn.query('SELECT next_val FROM id_sequences WHERE name = ? FOR UPDATE', [SEQUENCE_NAME]);
      const max = await this.getMaxProductNumber(conn.query.bind(conn));
      const nextVal = max + 1;
      await conn.query('UPDATE id_sequences SET next_val = ? WHERE name = ?', [nextVal + 1, SEQUENCE_NAME]);
      await conn.commit();
      return formatProductId(nextVal);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async reserveProductId(requestedId = null) {
    if (requestedId) {
      if (db.isMemoryMode()) {
        const exists = db.getMemory().products.some((p) => p.id === requestedId);
        if (exists) throw new Error('Product ID already exists');
        return requestedId;
      }
      const [rows] = await db.query('SELECT id FROM products WHERE id = ? LIMIT 1', [requestedId]);
      if (rows.length) throw new Error('Product ID already exists');
      return requestedId;
    }
    return this.getNextProductId();
  },
};

module.exports = ProductSequenceMysql;
