const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const cartSession = require('../middleware/cartSession.middleware');
const { requireAdminAuth, requirePermission } = require('../middleware/auth.middleware');
const { requireCustomerAuth, optionalCustomerAuth } = require('../middleware/customerAuth.middleware');
const { upload } = require('../middleware/upload.middleware');
const schemas = require('../validators/schemas');

const productCtrl = require('../controllers/product.controller');
const categoryCtrl = require('../controllers/category.controller');
const cartCtrl = require('../controllers/cart.controller');
const orderCtrl = require('../controllers/order.controller');
const contactCtrl = require('../controllers/contact.controller');
const paymentCtrl = require('../controllers/payment.controller');
const authCtrl = require('../controllers/auth.controller');
const customerAuthCtrl = require('../controllers/customerAuth.controller');
const settingsCtrl = require('../controllers/settings.controller');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'Daily Taaza API' } });
});

router.get('/settings/public', asyncHandler(settingsCtrl.getPublicSettings));

router.post('/auth/register', validate(schemas.customerRegisterSchema), asyncHandler(customerAuthCtrl.register));
router.post('/auth/login', validate(schemas.customerLoginSchema), asyncHandler(customerAuthCtrl.login));
router.get('/auth/me', requireCustomerAuth, asyncHandler(customerAuthCtrl.me));
router.put('/auth/me', requireCustomerAuth, validate(schemas.customerProfileSchema), asyncHandler(customerAuthCtrl.updateMe));
router.post('/auth/logout', requireCustomerAuth, asyncHandler(customerAuthCtrl.logout));

router.get('/customers/me/orders', requireCustomerAuth, asyncHandler(customerAuthCtrl.listOrders));
router.get('/customers/me/orders/:orderNumber', requireCustomerAuth, asyncHandler(customerAuthCtrl.getOrder));
router.post('/customers/me/orders/:orderNumber/cancel', requireCustomerAuth, asyncHandler(customerAuthCtrl.cancelOrder));
router.post('/customers/me/orders/:orderNumber/reorder', requireCustomerAuth, cartSession, asyncHandler(customerAuthCtrl.reorder));

router.get('/customers/me/addresses', requireCustomerAuth, asyncHandler(customerAuthCtrl.listAddresses));
router.post('/customers/me/addresses', requireCustomerAuth, validate(schemas.addressSchema), asyncHandler(customerAuthCtrl.createAddress));
router.put('/customers/me/addresses/:id', requireCustomerAuth, validate(schemas.addressSchema), asyncHandler(customerAuthCtrl.updateAddress));
router.delete('/customers/me/addresses/:id', requireCustomerAuth, asyncHandler(customerAuthCtrl.deleteAddress));

router.get('/products', asyncHandler(productCtrl.list));
router.get('/products/:id', asyncHandler(productCtrl.getOne));
router.get('/products/:id/related', asyncHandler(productCtrl.getRelated));

router.get('/categories', asyncHandler(categoryCtrl.list));
router.get('/categories/:id', asyncHandler(categoryCtrl.getOne));

router.get('/cart', optionalCustomerAuth, cartSession, asyncHandler(cartCtrl.getCart));
router.post('/cart/items', optionalCustomerAuth, cartSession, validate(schemas.cartItemSchema), asyncHandler(cartCtrl.addItem));
router.patch('/cart/items/:variantId', optionalCustomerAuth, cartSession, validate(schemas.cartUpdateSchema), asyncHandler(cartCtrl.updateItem));
router.delete('/cart/items/:variantId', optionalCustomerAuth, cartSession, asyncHandler(cartCtrl.removeItem));
router.delete('/cart', optionalCustomerAuth, cartSession, asyncHandler(cartCtrl.clear));

router.post('/orders', optionalCustomerAuth, cartSession, validate(schemas.orderSchema), asyncHandler(orderCtrl.create));
router.get('/orders/:orderNumber', optionalCustomerAuth, asyncHandler(orderCtrl.getOne));
router.get('/orders/:orderNumber/track', asyncHandler(orderCtrl.track));

router.post('/contact', validate(schemas.contactSchema), asyncHandler(contactCtrl.submitContact));
router.post('/newsletter', validate(schemas.newsletterSchema), asyncHandler(contactCtrl.subscribe));

router.post('/payments/create-order', asyncHandler(paymentCtrl.createOrder));
router.post('/payments/verify', validate(schemas.paymentVerifySchema), asyncHandler(paymentCtrl.verify));
router.post('/payments/webhook', asyncHandler(paymentCtrl.webhook));

router.post('/admin/auth/login', validate(schemas.adminLoginSchema), asyncHandler(authCtrl.login));
router.get('/admin/auth/me', requireAdminAuth, asyncHandler(authCtrl.me));

router.get('/admin/products', requireAdminAuth, requirePermission('products:read'), asyncHandler(productCtrl.list));
router.post('/admin/products', requireAdminAuth, requirePermission('products:write'), validate(schemas.productSchema), asyncHandler(productCtrl.create));
router.put('/admin/products/:id', requireAdminAuth, requirePermission('products:write'), validate(schemas.productUpdateSchema), asyncHandler(productCtrl.update));
router.delete('/admin/products/:id', requireAdminAuth, requirePermission('products:write'), asyncHandler(productCtrl.remove));

router.post('/admin/products/:id/images', requireAdminAuth, requirePermission('products:write'), upload.single('image'), asyncHandler(productCtrl.uploadImage));
router.delete('/admin/products/:id/images/:imageId', requireAdminAuth, requirePermission('products:write'), asyncHandler(productCtrl.deleteImage));
router.put('/admin/products/:id/images/:imageId/primary', requireAdminAuth, requirePermission('products:write'), asyncHandler(productCtrl.setPrimaryImage));

router.get('/admin/categories', requireAdminAuth, requirePermission('products:read'), asyncHandler(categoryCtrl.list));
router.post('/admin/categories', requireAdminAuth, requirePermission('products:write'), validate(schemas.categorySchema), asyncHandler(categoryCtrl.create));
router.put('/admin/categories/:id', requireAdminAuth, requirePermission('products:write'), validate(schemas.categoryUpdateSchema), asyncHandler(categoryCtrl.update));
router.delete('/admin/categories/:id', requireAdminAuth, requirePermission('products:write'), asyncHandler(categoryCtrl.remove));

router.get('/admin/orders', requireAdminAuth, requirePermission('orders:read'), asyncHandler(orderCtrl.list));
router.put('/admin/orders/:orderNumber/status', requireAdminAuth, requirePermission('orders:write'), validate(schemas.orderStatusSchema), asyncHandler(orderCtrl.updateStatus));

router.get('/admin/contact-messages', requireAdminAuth, requirePermission('contact:read'), asyncHandler(contactCtrl.listMessages));
router.put('/admin/contact-messages/:id/status', requireAdminAuth, requirePermission('contact:write'), validate(schemas.messageStatusSchema), asyncHandler(contactCtrl.updateMessageStatus));

router.post(
  '/admin/uploads/products',
  requireAdminAuth,
  requirePermission('products:write'),
  upload.single('image'),
  asyncHandler(settingsCtrl.uploadProductImage)
);

module.exports = router;
