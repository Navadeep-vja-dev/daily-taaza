const Joi = require('joi');

const contactSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().email().required(),
  message: Joi.string().trim().min(5).max(2000).required(),
});

const newsletterSchema = Joi.object({
  email: Joi.string().email().required(),
});

const variantSchema = Joi.object({
  id: Joi.string().required(),
  label: Joi.string().required(),
  weight_grams: Joi.number().integer().min(0).allow(null),
  weightGrams: Joi.number().integer().min(0).allow(null),
  price: Joi.number().positive().required(),
  compare_price: Joi.number().positive().allow(null),
  comparePrice: Joi.number().positive().allow(null),
  stock_qty: Joi.number().integer().min(0),
  stockQty: Joi.number().integer().min(0),
  is_default: Joi.boolean(),
  isDefault: Joi.boolean(),
  sort_order: Joi.number().integer().min(0),
  sortOrder: Joi.number().integer().min(0),
});

const cartItemSchema = Joi.object({
  productId: Joi.string().required(),
  variantId: Joi.string().allow(null),
  quantity: Joi.number().integer().min(1).max(99).default(1),
});

const cartUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(0).max(99).required(),
});

const orderSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(150).required(),
  phone: Joi.string().trim().pattern(/^[0-9+\-\s]{10,15}$/).required(),
  email: Joi.string().email().allow('', null),
  addressLine1: Joi.string().trim().min(5).max(255).required(),
  addressLine2: Joi.string().trim().max(255).allow('', null),
  city: Joi.string().trim().min(2).max(100).required(),
  pincode: Joi.string().trim().pattern(/^[0-9]{6}$/).required(),
  paymentMethod: Joi.string().valid('cod', 'online').default('cod'),
  notes: Joi.string().max(500).allow('', null),
});

const paymentVerifySchema = Joi.object({
  orderNumber: Joi.string().required(),
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const customerRegisterSchema = Joi.object({
  phone: Joi.string().trim().pattern(/^[0-9+\-\s]{10,15}$/).required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().email().allow('', null),
});

const customerLoginSchema = Joi.object({
  phone: Joi.string().trim().pattern(/^[0-9+\-\s]{10,15}$/).required(),
  password: Joi.string().min(6).required(),
});

const customerProfileSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(150),
  email: Joi.string().email().allow('', null),
});

const addressSchema = Joi.object({
  label: Joi.string().max(50).default('Home'),
  addressLine1: Joi.string().trim().min(5).max(255).required(),
  addressLine2: Joi.string().trim().max(255).allow('', null),
  city: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().max(100).default('Telangana'),
  pincode: Joi.string().trim().pattern(/^[0-9]{6}$/).required(),
  isDefault: Joi.boolean().default(false),
});

const productSchema = Joi.object({
  id: Joi.string(),
  category_id: Joi.number().integer().required(),
  name: Joi.string().required(),
  slug: Joi.string().required(),
  price: Joi.number().positive().required(),
  compare_price: Joi.number().positive().allow(null),
  badge: Joi.string().allow(null),
  description: Joi.string().required(),
  ingredients: Joi.array().items(Joi.string()),
  benefits: Joi.array().items(Joi.string()),
  image: Joi.string(),
  placeholder_color: Joi.string().required(),
  placeholder_text: Joi.string().allow(null),
  stock_qty: Joi.number().integer().min(0),
  variants: Joi.array().items(variantSchema),
});

const productUpdateSchema = Joi.object({
  category_id: Joi.number().integer(),
  name: Joi.string(),
  slug: Joi.string(),
  price: Joi.number().positive(),
  compare_price: Joi.number().positive().allow(null),
  badge: Joi.string().allow(null),
  description: Joi.string(),
  ingredients: Joi.array().items(Joi.string()),
  benefits: Joi.array().items(Joi.string()),
  image: Joi.string(),
  placeholder_color: Joi.string(),
  placeholder_text: Joi.string().allow(null),
  stock_qty: Joi.number().integer().min(0),
  is_active: Joi.number().valid(0, 1),
  variants: Joi.array().items(variantSchema),
}).min(1);

const categorySchema = Joi.object({
  label: Joi.string().required(),
  is_active: Joi.boolean().default(true),
});

const categoryUpdateSchema = Joi.object({
  label: Joi.string(),
  is_active: Joi.boolean(),
}).min(1);

const orderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')
    .required(),
  note: Joi.string().max(500).allow('', null),
});

const messageStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'read', 'resolved').required(),
});

module.exports = {
  contactSchema,
  newsletterSchema,
  cartItemSchema,
  cartUpdateSchema,
  orderSchema,
  paymentVerifySchema,
  adminLoginSchema,
  customerRegisterSchema,
  customerLoginSchema,
  customerProfileSchema,
  addressSchema,
  productSchema,
  productUpdateSchema,
  categorySchema,
  categoryUpdateSchema,
  orderStatusSchema,
  messageStatusSchema,
  variantSchema,
};
