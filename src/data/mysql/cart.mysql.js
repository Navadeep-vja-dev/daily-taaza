const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const ProductMysql = require('./product.mysql');
const ProductVariantMysql = require('./productVariant.mysql');
const { mapCartItemRow } = require('../../shared/utils/mappers');

const CART_TTL_DAYS = 7;

const CartMysql = {
  async getOrCreateSession(token, customerId = null) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      if (!token || !mem.cartSessions.has(token)) {
        token = uuidv4().replace(/-/g, '');
        mem.cartSessions.set(token, {
          id: db.nextId(),
          session_token: token,
          customer_id: customerId,
          expires_at: new Date(Date.now() + CART_TTL_DAYS * 86400000),
        });
        mem.cartItems.set(token, []);
      } else if (customerId) {
        const session = mem.cartSessions.get(token);
        session.customer_id = customerId;
      }
      return { token, session: mem.cartSessions.get(token) };
    }
    if (token) {
      const [rows] = await db.query(
        'SELECT * FROM cart_sessions WHERE session_token = ? AND expires_at > NOW() LIMIT 1',
        [token]
      );
      if (rows[0]) {
        if (customerId && !rows[0].customer_id) {
          await db.query('UPDATE cart_sessions SET customer_id = ? WHERE id = ?', [
            customerId,
            rows[0].id,
          ]);
          rows[0].customer_id = customerId;
        }
        return { token, session: rows[0] };
      }
    }
    token = uuidv4().replace(/-/g, '');
    const expires = new Date(Date.now() + CART_TTL_DAYS * 86400000);
    const [result] = await db.query(
      'INSERT INTO cart_sessions (session_token, expires_at, customer_id) VALUES (?, ?, ?)',
      [token, expires, customerId]
    );
    return { token, session: { id: result.insertId, session_token: token, customer_id: customerId } };
  },

  async getItems(token) {
    const { token: t } = await this.getOrCreateSession(token);
    if (db.isMemoryMode()) {
      const items = db.getMemory().cartItems.get(t) || [];
      return items.map(mapCartItemRow);
    }
    const [rows] = await db.query(
      `SELECT ci.*, p.name, p.image, p.placeholder_color, p.placeholder_text, pv.label AS variant_label
       FROM cart_items ci
       JOIN cart_sessions cs ON ci.cart_session_id = cs.id
       JOIN products p ON ci.product_id = p.id
       JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE cs.session_token = ?`,
      [t]
    );
    return rows.map(mapCartItemRow);
  },

  async resolveVariant(productId, variantId) {
    let variant;
    if (variantId) {
      variant = await ProductVariantMysql.getById(variantId);
      if (!variant || variant.productId !== productId) throw new Error('Variant not found');
    } else {
      variant = await ProductVariantMysql.getDefaultForProduct(productId);
    }
    if (!variant) throw new Error('Product variant not found');
    return variant;
  },

  async addItem(token, productId, quantity, variantId = null, customerId = null) {
    const product = await ProductMysql.getById(productId);
    if (!product || !product.isActive) throw new Error('Product not found');
    const variant = await this.resolveVariant(productId, variantId);
    if (variant.stockQty < quantity) throw new Error('Insufficient stock');

    const { token: t, session } = await this.getOrCreateSession(token, customerId);

    if (db.isMemoryMode()) {
      const items = db.getMemory().cartItems.get(t) || [];
      const existing = items.find((i) => i.variant_id === variant.id);
      if (existing) existing.quantity += quantity;
      else {
        items.push({
          product_id: productId,
          variant_id: variant.id,
          variant_label: variant.label,
          name: product.name,
          unit_price: variant.price,
          quantity,
          image: product.image,
          placeholder_color: product.placeholderColor,
          placeholder_text: product.placeholderText,
        });
      }
      db.getMemory().cartItems.set(t, items);
      return { token: t, items: items.map(mapCartItemRow) };
    }

    await db.query(
      `INSERT INTO cart_items (cart_session_id, product_id, variant_id, quantity, unit_price)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [session.id, productId, variant.id, quantity, variant.price]
    );
    return { token: t, items: await this.getItems(t) };
  },

  async updateItem(token, variantId, quantity, customerId = null) {
    const { token: t, session } = await this.getOrCreateSession(token, customerId);
    if (quantity <= 0) return this.removeItem(t, variantId, customerId);

    if (db.isMemoryMode()) {
      const items = db.getMemory().cartItems.get(t) || [];
      const item = items.find((i) => i.variant_id === variantId);
      if (item) item.quantity = quantity;
      return { token: t, items: items.map(mapCartItemRow) };
    }

    await db.query(
      `UPDATE cart_items ci JOIN cart_sessions cs ON ci.cart_session_id = cs.id
       SET ci.quantity = ? WHERE cs.session_token = ? AND ci.variant_id = ?`,
      [quantity, t, variantId]
    );
    return { token: t, items: await this.getItems(t) };
  },

  async removeItem(token, variantId, customerId = null) {
    const { token: t } = await this.getOrCreateSession(token, customerId);
    if (db.isMemoryMode()) {
      const items = (db.getMemory().cartItems.get(t) || []).filter((i) => i.variant_id !== variantId);
      db.getMemory().cartItems.set(t, items);
      return { token: t, items: items.map(mapCartItemRow) };
    }
    await db.query(
      `DELETE ci FROM cart_items ci JOIN cart_sessions cs ON ci.cart_session_id = cs.id
       WHERE cs.session_token = ? AND ci.variant_id = ?`,
      [t, variantId]
    );
    return { token: t, items: await this.getItems(t) };
  },

  async clear(token) {
    const { token: t, session } = await this.getOrCreateSession(token);
    if (db.isMemoryMode()) {
      db.getMemory().cartItems.set(t, []);
      return { token: t, items: [] };
    }
    await db.query('DELETE FROM cart_items WHERE cart_session_id = ?', [session.id]);
    return { token: t, items: [] };
  },

  async addOrderItems(token, orderItems, customerId = null) {
    for (const item of orderItems) {
      const variantId = item.variantId || item.variant_id;
      const productId = item.productId || item.id || item.product_id;
      await this.addItem(token, productId, item.quantity, variantId, customerId);
    }
    return this.getItems(token);
  },
};

module.exports = CartMysql;
