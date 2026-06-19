function parseJsonField(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function mapProductRow(row, extras = {}) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category_id || row.category,
    price: Number(row.price),
    comparePrice: row.compare_price != null ? Number(row.compare_price) : null,
    badge: row.badge,
    description: row.description,
    ingredients: parseJsonField(row.ingredients),
    benefits: parseJsonField(row.benefits),
    image: row.image,
    placeholderColor: row.placeholder_color,
    placeholderText: row.placeholder_text,
    stockQty: row.stock_qty,
    isActive: Boolean(row.is_active),
    ...extras,
  };
}

function mapVariantRow(row) {
  if (!row) return null;
  if (row.productId) return row;
  return {
    id: row.id,
    productId: row.product_id,
    label: row.label,
    weightGrams: row.weight_grams,
    price: Number(row.price),
    comparePrice: row.compare_price != null ? Number(row.compare_price) : null,
    stockQty: row.stock_qty,
    isDefault: Boolean(row.is_default),
    sortOrder: row.sort_order,
  };
}

function mapImageRow(row) {
  if (!row) return null;
  if (row.path) return row;
  return {
    id: row.id,
    productId: row.product_id,
    path: row.file_path,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    isPrimary: Boolean(row.is_primary),
  };
}

function mapCartItemRow(row) {
  if (!row) return null;
  return {
    id: row.product_id,
    productId: row.product_id,
    variantId: row.variant_id,
    variantLabel: row.variant_label || row.label,
    name: row.name || row.product_name,
    price: Number(row.unit_price || row.price),
    quantity: row.quantity,
    image: row.image,
    placeholderColor: row.placeholder_color,
    placeholderText: row.placeholder_text,
  };
}

function mapCategoryRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    label: row.label,
    sortOrder: row.sort_order,
    isActive: Boolean(row.is_active),
  };
}

module.exports = {
  mapProductRow,
  mapCategoryRow,
  mapCartItemRow,
  mapVariantRow,
  mapImageRow,
  parseJsonField,
};
