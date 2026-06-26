const CustomerMysql = require('../../data/mysql/customer.mysql');
const CustomerAddressMysql = require('../../data/mysql/customerAddress.mysql');
const OrderMysql = require('../../data/mysql/order.mysql');
const CartMysql = require('../../data/mysql/cart.mysql');
const CustomerAuthServiceServer = require('../auth/CustomerAuthService.server');
const AppError = require('../../shared/errors/AppError');

const CustomerServiceServer = {
  async getProfile(customerId) {
    const customer = await CustomerMysql.findById(customerId);
    if (!customer) throw AppError.notFound('Customer not found');
    return CustomerAuthServiceServer.mapCustomer(customer);
  },

  async updateProfile(customerId, data) {
    await CustomerMysql.update(customerId, {
      full_name: data.fullName,
      email: data.email,
    });
    return this.getProfile(customerId);
  },

  async listAddresses(customerId) {
    return CustomerAddressMysql.listByCustomer(customerId);
  },

  async createAddress(customerId, data) {
    return CustomerAddressMysql.create(customerId, data);
  },

  async updateAddress(customerId, addressId, data) {
    const address = await CustomerAddressMysql.update(customerId, addressId, data);
    if (!address) throw AppError.notFound('Address not found');
    return address;
  },

  async deleteAddress(customerId, addressId) {
    const ok = await CustomerAddressMysql.delete(customerId, addressId);
    if (!ok) throw AppError.notFound('Address not found');
    return { deleted: true };
  },

  async listOrders(customerId) {
    return OrderMysql.getByCustomerId(customerId);
  },

  async getOrder(customerId, orderNumber) {
    const order = await OrderMysql.getByOrderNumber(orderNumber);
    if (!order || order.customerId !== customerId) {
      throw AppError.notFound('Order not found');
    }
    return order;
  },

  async cancelOrder(customerId, orderNumber) {
    try {
      const order = await OrderMysql.cancelByCustomer(orderNumber, customerId);
      if (!order) throw AppError.notFound('Order not found');
      return order;
    } catch (err) {
      if (err.message === 'Order cannot be cancelled at this stage') {
        throw AppError.badRequest(err.message);
      }
      throw err;
    }
  },

  async reorder(customerId, orderNumber, cartToken) {
    const order = await this.getOrder(customerId, orderNumber);
    let token = cartToken;
    const skipped = [];

    for (const item of order.items) {
      try {
        const result = await CartMysql.addItem(
          token,
          item.productId || item.id,
          item.quantity,
          item.variantId,
          customerId
        );
        token = result.token;
      } catch (err) {
        skipped.push({
          name: item.name,
          variantLabel: item.variantLabel || null,
          reason: err.message,
        });
      }
    }

    const items = await CartMysql.getItems(token);
    return { items, cartToken: token, skipped };
  },
};

module.exports = CustomerServiceServer;
