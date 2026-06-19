const db = require('./db');

function mapAddressRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id,
    label: row.label,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    isDefault: Boolean(row.is_default),
  };
}

const CustomerAddressMysql = {
  async listByCustomer(customerId) {
    if (db.isMemoryMode()) {
      return (db.getMemory().customerAddresses || [])
        .filter((a) => a.customer_id === customerId)
        .map(mapAddressRow);
    }
    const [rows] = await db.query(
      'SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id ASC',
      [customerId]
    );
    return rows.map(mapAddressRow);
  },

  async create(customerId, data) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      if (!mem.customerAddresses) mem.customerAddresses = [];
      if (data.is_default || data.isDefault) {
        mem.customerAddresses.forEach((a) => {
          if (a.customer_id === customerId) a.is_default = 0;
        });
      }
      const row = {
        id: db.nextId(),
        customer_id: customerId,
        label: data.label || 'Home',
        address_line1: data.address_line1 || data.addressLine1,
        address_line2: data.address_line2 || data.addressLine2 || null,
        city: data.city,
        state: data.state || 'Telangana',
        pincode: data.pincode,
        is_default: data.is_default || data.isDefault ? 1 : 0,
      };
      mem.customerAddresses.push(row);
      return mapAddressRow(row);
    }
    if (data.is_default || data.isDefault) {
      await db.query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?', [
        customerId,
      ]);
    }
    const [result] = await db.query(
      `INSERT INTO customer_addresses (customer_id, label, address_line1, address_line2, city, state, pincode, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        data.label || 'Home',
        data.address_line1 || data.addressLine1,
        data.address_line2 || data.addressLine2 || null,
        data.city,
        data.state || 'Telangana',
        data.pincode,
        data.is_default || data.isDefault ? 1 : 0,
      ]
    );
    const [rows] = await db.query('SELECT * FROM customer_addresses WHERE id = ?', [result.insertId]);
    return mapAddressRow(rows[0]);
  },

  async update(customerId, addressId, data) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      const row = (mem.customerAddresses || []).find(
        (a) => a.id === Number(addressId) && a.customer_id === customerId
      );
      if (!row) return null;
      Object.assign(row, {
        label: data.label ?? row.label,
        address_line1: data.address_line1 || data.addressLine1 || row.address_line1,
        address_line2: data.address_line2 || data.addressLine2 || row.address_line2,
        city: data.city ?? row.city,
        state: data.state ?? row.state,
        pincode: data.pincode ?? row.pincode,
        is_default:
          data.is_default !== undefined || data.isDefault !== undefined
            ? data.is_default || data.isDefault
              ? 1
              : 0
            : row.is_default,
      });
      return mapAddressRow(row);
    }
    await db.query(
      `UPDATE customer_addresses SET label = COALESCE(?, label), address_line1 = COALESCE(?, address_line1),
       address_line2 = COALESCE(?, address_line2), city = COALESCE(?, city), state = COALESCE(?, state),
       pincode = COALESCE(?, pincode), is_default = COALESCE(?, is_default)
       WHERE id = ? AND customer_id = ?`,
      [
        data.label,
        data.address_line1 || data.addressLine1,
        data.address_line2 || data.addressLine2,
        data.city,
        data.state,
        data.pincode,
        data.is_default !== undefined ? (data.is_default || data.isDefault ? 1 : 0) : undefined,
        addressId,
        customerId,
      ]
    );
    const [rows] = await db.query(
      'SELECT * FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [addressId, customerId]
    );
    return mapAddressRow(rows[0]);
  },

  async delete(customerId, addressId) {
    if (db.isMemoryMode()) {
      const mem = db.getMemory();
      const idx = (mem.customerAddresses || []).findIndex(
        (a) => a.id === Number(addressId) && a.customer_id === customerId
      );
      if (idx === -1) return false;
      mem.customerAddresses.splice(idx, 1);
      return true;
    }
    const [result] = await db.query(
      'DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [addressId, customerId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = CustomerAddressMysql;
