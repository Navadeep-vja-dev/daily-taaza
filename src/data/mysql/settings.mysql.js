const db = require('./db');

const SettingsMysql = {
  async get(key, defaultValue = null) {
    if (db.isMemoryMode()) {
      const val = db.getMemory().settings[key];
      if (val !== undefined) return val;
      const defaults = { delivery_fee: '49', site_name: 'Daily Taaza', whatsapp_business_phone: '919876543210' };
      return defaults[key] ?? defaultValue;
    }
    const [rows] = await db.query('SELECT value FROM settings WHERE `key` = ? LIMIT 1', [key]);
    return rows[0] ? rows[0].value : defaultValue;
  },

  async getPublic() {
    if (db.isMemoryMode()) {
      return {
        delivery_fee: await this.get('delivery_fee', '49'),
        site_name: await this.get('site_name', 'Daily Taaza'),
      };
    }
    const [rows] = await db.query('SELECT `key`, value FROM settings WHERE is_public = 1');
    return rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
  },

  async set(key, value, isPublic = false) {
    if (db.isMemoryMode()) {
      db.getMemory().settings[key] = value;
      return { key, value };
    }
    await db.query(
      'INSERT INTO settings (`key`, value, is_public) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?, is_public = ?',
      [key, value, isPublic ? 1 : 0, value, isPublic ? 1 : 0]
    );
    return { key, value };
  },
};

module.exports = SettingsMysql;
