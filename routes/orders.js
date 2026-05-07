// orders.js
const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  requestReturn,
  reviewReturnRequest,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/Auth');

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.post('/:id/return-request', protect, requestReturn);
router.put('/:id/return-request', protect, adminOnly, reviewReturnRequest);
router.get('/:id', protect, getOrder);
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
