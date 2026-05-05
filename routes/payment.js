const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  getRazorpayKey,
} = require('../controllers/payementController');
const { protect } = require('../middleware/Auth');

router.get('/key', protect, getRazorpayKey);
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
