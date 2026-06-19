/**
 * Domain layer — Order service (checkout prototype)
 */
const OrderService = {
  validateCheckout(cartItems) {
    if (!cartItems || !cartItems.length) {
      return { valid: false, message: 'Your cart is empty.' };
    }
    return { valid: true };
  },

  submitPrototype(cartItems) {
    const check = this.validateCheckout(cartItems);
    if (!check.valid) return check;
    return {
      valid: true,
      message: 'Thank you! Checkout is a prototype feature. Your cart has been saved locally.',
    };
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderService;
}
