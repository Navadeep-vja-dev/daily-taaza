/**
 * Presentation layer — Home page
 */
const HomePage = {
  async init() {
    const featuredGrid = document.getElementById('featured-products');
    if (featuredGrid) {
      const products = await ProductService.getAll();
      renderProductGrid(featuredGrid, products.slice(0, 4));
    }
  },
};
