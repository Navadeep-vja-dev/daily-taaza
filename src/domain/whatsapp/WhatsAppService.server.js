const db = require('../../data/mysql/db');
const { env } = require('../../shared/config/env');
const logger = require('../../shared/logger');

function buildBusinessMessage(order) {
  const items = (order.items || [])
    .map((i) => `${i.name} x${i.quantity}`)
    .join(', ');
  return (
    `New Daily Taaza Order #${order.orderNumber}\n` +
    `Customer: ${order.deliveryName} | ${order.deliveryPhone}\n` +
    `Items: ${items}\n` +
    `Total: ₹${order.total} | Payment: ${order.paymentMethod?.toUpperCase()}\n` +
    `Address: ${order.deliveryAddress}`
  );
}

function buildCustomerMessage(order) {
  return (
    `Hi ${order.deliveryName}! Your Daily Taaza order #${order.orderNumber} is confirmed.\n` +
    `Total: ₹${order.total} | ${order.paymentMethod === 'cod' ? 'COD' : 'Online'}\n` +
    `We will prepare your fresh items soon.`
  );
}

function buildWaMeLink(phone, message) {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

const WhatsAppServiceServer = {
  async logMessage(orderId, phone, body, status, error) {
    if (db.isMemoryMode()) {
      db.getMemory().whatsappLogs.push({
        id: db.nextId(),
        order_id: orderId,
        recipient_phone: phone,
        message_body: body,
        status,
        error_message: error || null,
      });
      return;
    }
    await db.query(
      'INSERT INTO whatsapp_logs (order_id, recipient_phone, message_body, status, error_message) VALUES (?, ?, ?, ?, ?)',
      [orderId, phone, body, status, error || null]
    );
  },

  async sendViaApi(phone, message) {
    if (!env.whatsapp.accessToken || !env.whatsapp.phoneNumberId) {
      throw new Error('WhatsApp API not configured');
    }
    const url = `${env.whatsapp.apiUrl}/${env.whatsapp.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      }),
    });
    if (!res.ok) throw new Error(`WhatsApp API error: ${res.status}`);
    return res.json();
  },

  async sendOrderConfirmation(order) {
    const businessMsg = buildBusinessMessage(order);
    const customerMsg = buildCustomerMessage(order);
    const businessPhone = env.whatsapp.businessPhone;

    const waLinks = {
      business: buildWaMeLink(businessPhone, businessMsg),
      customer: buildWaMeLink(order.deliveryPhone, customerMsg),
    };

    try {
      if (env.whatsapp.accessToken) {
        await this.sendViaApi(businessPhone, businessMsg);
        await this.sendViaApi(order.deliveryPhone, customerMsg);
        await this.logMessage(order.id, businessPhone, businessMsg, 'sent');
        await this.logMessage(order.id, order.deliveryPhone, customerMsg, 'sent');
      } else {
        await this.logMessage(order.id, businessPhone, businessMsg, 'queued');
        logger.info('WhatsApp MVP — use wa.me links', waLinks);
      }
    } catch (err) {
      await this.logMessage(order.id, businessPhone, businessMsg, 'failed', err.message);
    }

    return { waLinks, message: 'Notification queued' };
  },

  async sendStatusUpdate(order) {
    const msg = `Daily Taaza Update: Order #${order.orderNumber} is now "${order.status}". Thank you!`;
    try {
      if (env.whatsapp.accessToken) {
        await this.sendViaApi(order.deliveryPhone, msg);
      }
      await this.logMessage(order.id, order.deliveryPhone, msg, 'sent');
    } catch (err) {
      await this.logMessage(order.id, order.deliveryPhone, msg, 'failed', err.message);
    }
  },
};

module.exports = WhatsAppServiceServer;
