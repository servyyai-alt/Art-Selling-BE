const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { sendPaymentConfirmedEmail } = require('../services/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: { userId: req.user._id.toString() },
    };

    const order = await razorpay.orders.create(options);
    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update order payment info
    const order = await Order.findById(orderId).populate('user', 'name email');
    if (order) {
      order.paymentInfo = {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
        paidAt: Date.now(),
      };
      order.orderStatus = 'Confirmed';
      order.statusHistory.push({ status: 'Confirmed', note: 'Payment confirmed via Razorpay' });
      await order.save();

      if (order.user?.email) {
        sendPaymentConfirmedEmail({ user: order.user, order }).catch((mailErr) => {
          console.error('[payment-confirmed-email] Failed to send:', mailErr.message);
        });
      }
    }

    res.json({ success: true, message: 'Payment verified successfully', orderId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get Razorpay key
// @route   GET /api/payment/key
exports.getRazorpayKey = async (req, res) => {
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
};
