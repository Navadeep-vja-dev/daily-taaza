const db = require('./db');

const PaymentMysql = {
  async create(orderId, amount) {
    if (db.isMemoryMode()) {
      const payment = {
        id: db.nextId(),
        order_id: orderId,
        provider: 'razorpay',
        amount,
        currency: 'INR',
        status: 'created',
      };
      db.getMemory().payments.push(payment);
      return payment;
    }
    const [result] = await db.query(
      'INSERT INTO payments (order_id, amount, status) VALUES (?, ?, ?)',
      [orderId, amount, 'created']
    );
    const [rows] = await db.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
    return rows[0];
  },

  async findByOrderId(orderId) {
    if (db.isMemoryMode()) {
      return db.getMemory().payments.find((p) => p.order_id === orderId) || null;
    }
    const [rows] = await db.query('SELECT * FROM payments WHERE order_id = ? LIMIT 1', [orderId]);
    return rows[0] || null;
  },

  async updateProviderOrderId(paymentId, providerOrderId) {
    if (db.isMemoryMode()) {
      const p = db.getMemory().payments.find((x) => x.id === paymentId);
      if (p) p.provider_order_id = providerOrderId;
      return p;
    }
    await db.query('UPDATE payments SET provider_order_id = ? WHERE id = ?', [providerOrderId, paymentId]);
    const [rows] = await db.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
    return rows[0];
  },

  async markCaptured(paymentId, providerPaymentId, rawResponse) {
    if (db.isMemoryMode()) {
      const p = db.getMemory().payments.find((x) => x.id === paymentId);
      if (p) {
        p.status = 'captured';
        p.provider_payment_id = providerPaymentId;
        p.raw_response = rawResponse;
      }
      return p;
    }
    await db.query(
      'UPDATE payments SET status = ?, provider_payment_id = ?, raw_response = ? WHERE id = ?',
      ['captured', providerPaymentId, JSON.stringify(rawResponse), paymentId]
    );
    const [rows] = await db.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
    return rows[0];
  },

  async logEvent(paymentId, eventType, providerEventId, payload) {
    if (db.isMemoryMode()) return { id: db.nextId(), payment_id: paymentId, event_type: eventType };
    await db.query(
      'INSERT INTO payment_events (payment_id, event_type, provider_event_id, payload) VALUES (?, ?, ?, ?)',
      [paymentId, eventType, providerEventId, JSON.stringify(payload)]
    );
  },
};

module.exports = PaymentMysql;
