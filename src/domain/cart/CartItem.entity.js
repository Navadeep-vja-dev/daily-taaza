/**
 * Domain layer — Cart item entity
 */
const CartItem = {
  fromProduct(product, quantity) {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
      placeholderColor: product.placeholderColor,
      placeholderText: product.placeholderText || '#2D5A27',
    };
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartItem;
}
