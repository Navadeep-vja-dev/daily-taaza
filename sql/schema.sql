-- Daily Taaza — Full database schema
CREATE DATABASE IF NOT EXISTS daily_taaza CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE daily_taaza;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_active (is_active)
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2) NULL,
  badge VARCHAR(50) NULL,
  description TEXT NOT NULL,
  ingredients JSON NOT NULL,
  benefits JSON NOT NULL,
  image VARCHAR(255) NOT NULL,
  placeholder_color VARCHAR(20) NOT NULL,
  placeholder_text VARCHAR(20) NULL,
  stock_qty INT NOT NULL DEFAULT 100,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_products_category (category_id),
  INDEX idx_products_active (is_active),
  INDEX idx_products_slug (slug)
);

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  alt_text VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(100) PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  label VARCHAR(50) NOT NULL,
  weight_grams INT NULL,
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2) NULL,
  stock_qty INT NOT NULL DEFAULT 100,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_variants_product (product_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NULL,
  is_guest TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customers_phone (phone),
  INDEX idx_customers_email (email)
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  label VARCHAR(50) NOT NULL DEFAULT 'Home',
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL DEFAULT 'Telangana',
  pincode VARCHAR(10) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_token VARCHAR(64) NOT NULL UNIQUE,
  customer_id BIGINT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cart_session_id BIGINT NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  variant_id VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_session_id) REFERENCES cart_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  UNIQUE KEY uq_cart_variant (cart_session_id, variant_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL,
  status ENUM('pending','confirmed','preparing','out_for_delivery','delivered','cancelled') NOT NULL DEFAULT 'pending',
  payment_method ENUM('cod','online') NOT NULL,
  payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  delivery_name VARCHAR(150) NOT NULL,
  delivery_phone VARCHAR(20) NOT NULL,
  delivery_address TEXT NOT NULL,
  notes TEXT NULL,
  whatsapp_sent TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_number (order_number)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  variant_id VARCHAR(100) NULL,
  variant_label VARCHAR(50) NULL,
  product_name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_items_product_ref (product_id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL,
  note VARCHAR(255) NULL,
  changed_by BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  provider_order_id VARCHAR(100) NULL,
  provider_payment_id VARCHAR(100) NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('created','authorized','captured','failed','refunded') NOT NULL DEFAULT 'created',
  raw_response JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  provider_event_id VARCHAR(100) NULL UNIQUE,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','read','replied') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS admin_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  permissions JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role_id INT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES admin_roles(id)
);

CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_user_id BIGINT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  template_name VARCHAR(100) NULL,
  message_body TEXT NOT NULL,
  status ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  provider_message_id VARCHAR(100) NULL,
  error_message TEXT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS id_sequences (
  name VARCHAR(50) PRIMARY KEY,
  next_val BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO admin_roles (id, name, permissions) VALUES
  (1, 'super_admin', '["*"]'),
  (2, 'manager', '["products:read","products:write","orders:read","orders:write","contact:read"]'),
  (3, 'support', '["orders:read","contact:read","contact:write"]');

INSERT IGNORE INTO settings (`key`, value, is_public) VALUES
  ('delivery_fee', '49', 1),
  ('whatsapp_business_phone', '919876543210', 0),
  ('site_name', 'Daily Taaza', 1);
