const db = require('./db');

const ContactMysql = {
  async createMessage(data) {
    if (db.isMemoryMode()) {
      const msg = { id: db.nextId(), ...data, status: 'new', created_at: new Date() };
      db.getMemory().contactMessages.push(msg);
      return msg;
    }
    const [result] = await db.query(
      'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
      [data.name, data.email, data.message]
    );
    const [rows] = await db.query('SELECT * FROM contact_messages WHERE id = ?', [result.insertId]);
    return rows[0];
  },

  async subscribe(email) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      if (mem.newsletter.find((n) => n.email === email)) throw new Error('Already subscribed');
      const sub = { id: db.nextId(), email, is_active: 1 };
      mem.newsletter.push(sub);
      return sub;
    }
    await db.query(
      'INSERT INTO newsletter_subscriptions (email) VALUES (?) ON DUPLICATE KEY UPDATE is_active = 1',
      [email]
    );
    const [rows] = await db.query('SELECT * FROM newsletter_subscriptions WHERE email = ?', [email]);
    return rows[0];
  },

  async getMessages() {
    if (db.isMemoryMode()) return db.getMemory().contactMessages;
    const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    return rows;
  },

  async updateMessageStatus(id, status) {
    if (db.isMemoryMode()) {
      const msg = db.getMemory().contactMessages.find((m) => m.id === id);
      if (msg) msg.status = status;
      return msg;
    }
    await db.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
    const [rows] = await db.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
    return rows[0];
  },
};

module.exports = ContactMysql;
