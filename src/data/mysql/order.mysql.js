const db = require('./db');
const ProductVariantMysql = require('./productVariant.mysql');
const CartMysql = require('./cart.mysql');
const CustomerMysql = require('./customer.mysql');
const SettingsMysql = require('./settings.mysql');

function generateOrderNumber() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `DT-${date}-${seq}`;
}

function mapOrderItem(i) {
  return {
    id: i.product_id || i.id,
    productId: i.product_id || i.id,
    variantId: i.variant_id || i.variantId,
    variantLabel: i.variant_label || i.variantLabel,
    name: i.product_name || i.name,
    price: Number(i.unit_price || i.price),
    quantity: i.quantity,
    lineTotal: Number(i.line_total || i.price * i.quantity),
  };
}

function mapOrder(order, items) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    customerId: order.customer_id,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.delivery_fee),
    total: Number(order.total),
    deliveryName: order.delivery_name,
    deliveryPhone: order.delivery_phone,
    deliveryAddress: order.delivery_address,
    notes: order.notes,
    items: (items || order.items || []).map(mapOrderItem),
    createdAt: order.created_at,
  };
}

const OrderMysql = {
  mapOrder,

  async createFromCart(cartToken, checkoutData, customerIdOverride = null) {
    const items = await CartMysql.getItems(cartToken);
    if (!items.length) throw new Error('Cart is empty');

    let customer;
    if (customerIdOverride) {
      customer = await CustomerMysql.findById(customerIdOverride);
    }
    if (!customer) {
      customer = await CustomerMysql.findByPhone(checkoutData.phone);
    }
    if (!customer) {
      customer = await CustomerMysql.create({
        full_name: checkoutData.fullName,
        email: checkoutData.email || null,
        phone: checkoutData.phone,
        is_guest: 1,
      });
    }

    const deliveryFee = Number(await SettingsMysql.get('delivery_fee', 49));
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = subtotal + deliveryFee;
    const orderNumber = generateOrderNumber();
    const address = [checkoutData.addressLine1, checkoutData.addressLine2, checkoutData.city, checkoutData.pincode]
      .filter(Boolean)
      .join(', ');

    const paymentMethod = checkoutData.paymentMethod || 'cod';
    const paymentStatus = 'pending';
    const status = paymentMethod === 'cod' ? 'confirmed' : 'pending';

    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      const orderId = db.nextId();
      const order = {
        id: orderId,
        order_number: orderNumber,
        customer_id: customer.id,
        status,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        delivery_name: checkoutData.fullName,
        delivery_phone: checkoutData.phone,
        delivery_address: address,
        notes: checkoutData.notes || null,
        whatsapp_sent: 0,
        created_at: new Date(),
        items,
      };
      mem.orders.push(order);
      await CartMysql.clear(cartToken);
      return mapOrder(order, items);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [orderResult] = await conn.query(
        `INSERT INTO orders (order_number, customer_id, status, payment_method, payment_status,
          subtotal, delivery_fee, total, delivery_name, delivery_phone, delivery_address, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          customer.id,
          status,
          paymentMethod,
          paymentStatus,
          subtotal,
          deliveryFee,
          total,
          checkoutData.fullName,
          checkoutData.phone,
          address,
          checkoutData.notes || null,
        ]
      );
      const orderId = orderResult.insertId;
      for (const item of items) {
        await ProductVariantMysql.decrementStock(item.variantId, item.quantity, conn);
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, variant_id, variant_label, product_name, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.productId || item.id,
            item.variantId,
            item.variantLabel,
            item.name,
            item.price,
            item.quantity,
            item.price * item.quantity,
          ]
        );
      }
      await conn.query(
        'INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
        [orderId, status, 'Order placed']
      );
      await conn.commit();
      await CartMysql.clear(cartToken);
      return this.getByOrderNumber(orderNumber);
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async getByOrderNumber(orderNumber) {
    if (db.isMemoryMode()) {
      const order = db.getMemory().orders.find((o) => o.order_number === orderNumber);
      if (!order) return null;
      return mapOrder(order, order.items);
    }
    const [rows] = await db.query('SELECT * FROM orders WHERE order_number = ? LIMIT 1', [orderNumber]);
    if (!rows[0]) return null;
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [rows[0].id]);
    return mapOrder(rows[0], items);
  },

  async getByCustomerId(customerId) {
    if (db.isMemoryMode()) {
      const orders = db.getMemory().orders.filter((o) => o.customer_id === customerId);
      return orders.map((o) => mapOrder(o, o.items));
    }
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
    const result = [];
    for (const row of rows) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [row.id]);
      result.push(mapOrder(row, items));
    }
    return result;
  },

  async getAll() {
    if (db.isMemoryMode()) {
      return db.getMemory().orders.map((o) => mapOrder(o, o.items));
    }
    const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    const result = [];
    for (const row of rows) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [row.id]);
      result.push(mapOrder(row, items));
    }
    return result;
  },

  async cancelByCustomer(orderNumber, customerId) {
    const order = await this.getByOrderNumber(orderNumber);
    if (!order || order.customerId !== customerId) return null;
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new Error('Order cannot be cancelled at this stage');
    }
    return this.updateStatus(orderNumber, 'cancelled', 'Cancelled by customer', null);
  },

  async updateStatus(orderNumber, status, note, adminId) {
    if (db.isMemoryMode()) {
      const order = db.getMemory().orders.find((o) => o.order_number === orderNumber);
      if (!order) return null;
      order.status = status;
      return mapOrder(order, order.items);
    }
    const [rows] = await db.query('SELECT id FROM orders WHERE order_number = ?', [orderNumber]);
    if (!rows[0]) return null;
    await db.query('UPDATE orders SET status = ? WHERE order_number = ?', [status, orderNumber]);
    await db.query(
      'INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES (?, ?, ?, ?)',
      [rows[0].id, status, note || null, adminId || null]
    );
    return this.getByOrderNumber(orderNumber);
  },

  async updatePaymentStatus(orderNumber, paymentStatus) {
    if (db.isMemoryMode()) {
      const order = db.getMemory().orders.find((o) => o.order_number === orderNumber);
      if (order) {
        order.payment_status = paymentStatus;
        if (paymentStatus === 'paid') order.status = 'confirmed';
      }
      return mapOrder(order, order.items);
    }
    await db.query(
      'UPDATE orders SET payment_status = ?, status = IF(? = "paid", "confirmed", status) WHERE order_number = ?',
      [paymentStatus, paymentStatus, orderNumber]
    );
    return this.getByOrderNumber(orderNumber);
  },

  async findById(id) {
    if (db.isMemoryMode()) {
      return db.getMemory().orders.find((o) => o.id === id) || null;
    }
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    return rows[0] || null;
  },
};

module.exports = OrderMysql;
