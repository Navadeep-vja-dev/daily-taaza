/**
 * Domain layer — Contact validation
 */
const ContactService = {
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validateNewsletter(email) {
    if (!email || !this.isValidEmail(email)) {
      return { valid: false, field: 'email' };
    }
    return { valid: true };
  },

  validateContact({ name, email, message }) {
    const errors = [];
    if (!name || !name.trim()) errors.push('name');
    if (!email || !email.trim()) errors.push('email');
    else if (!this.isValidEmail(email)) errors.push('email');
    if (!message || !message.trim()) errors.push('message');
    return { valid: errors.length === 0, errors };
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContactService;
}
