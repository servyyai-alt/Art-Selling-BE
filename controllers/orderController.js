const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderPlacedEmail, sendOrderStatusEmail } = require('../services/emailService');
const Razorpay = require('razorpay');

const RETURN_WINDOW_DAYS = 7;
let razorpayClient = null;

const getRazorpayClient = () => {
  if (razorpayClient) return razorpayClient;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured');
  }

  razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  return razorpayClient;
};

const isReturnWindowOpen = (order) => {
  if (!order?.deliveredAt) return false;
  const deliveredAt = new Date(order.deliveredAt).getTime();
  const deadline = deliveredAt + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() <= deadline;
};

const normalizeRefundAmount = (requestedAmount, orderTotal) => {
  const safeTotal = Number(orderTotal || 0);
  const safeRequested = Number(requestedAmount || safeTotal);
  if (!Number.isFinite(safeRequested) || safeRequested <= 0) return 0;
  return Math.min(safeRequested, safeTotal);
};

const restockOrderItems = async (order) => {
  if (order.returnRequest?.inventoryRestockedAt) return;

  for (const item of order.orderItems || []) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: Number(item.quantity) || 1 },
    });
  }

  order.returnRequest.inventoryRestockedAt = new Date();
};

// @desc    Create order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems = [],
      shippingAddress,
      itemsPrice,
      shippingPrice = 0,
      taxPrice = 0,
      totalPrice,
      notes = '',
    } = req.body;

    if (!orderItems.length) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }

    const normalizedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }

      const quantity = Number(item.quantity) || 1;
      if (product.stock < quantity) {
        return res.status(400).json({ success: false, message: `${product.title} is out of stock` });
      }

      normalizedItems.push({
        product: product._id,
        title: item.title || product.title,
        artist: item.artist || product.artist,
        image: item.image || product.images?.[0]?.url || '',
        price: Number(item.price ?? product.price),
        quantity,
      });
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems: normalizedItems,
      shippingAddress,
      itemsPrice: Number(itemsPrice) || 0,
      shippingPrice: Number(shippingPrice) || 0,
      taxPrice: Number(taxPrice) || 0,
      totalPrice: Number(totalPrice) || 0,
      notes,
      paymentInfo: { status: 'pending' },
      statusHistory: [{ status: 'Processing', note: 'Order created' }],
    });

    for (const item of normalizedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [], totalPrice: 0 } }
    );

    const customer = await User.findById(req.user._id).select('name email');
    if (customer?.email) {
      sendOrderPlacedEmail({ user: customer, order }).catch((mailErr) => {
        console.error('[order-created-email] Failed to send:', mailErr.message);
      });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/myorders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'title artist images slug');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isOwner = order.user?._id?.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// exports.getAllOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({})
//       .populate('user', 'name email')
//       .sort({ createdAt: -1 });

//     res.json({ success: true, orders });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};

    // ✅ Status filter (case-insensitive)
    if (status) {
      query.orderStatus = { $regex: `^${status}$`, $options: 'i' };
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note = '', trackingNumber } = req.body;
    const validStatuses = ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus === 'Refunded') {
      return res.status(400).json({ success: false, message: 'Refunded orders cannot be updated' });
    }

    if (order.returnRequest?.status === 'requested' && status !== 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Resolve the return request before changing the order status' });
    }

    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (status === 'Delivered') order.deliveredAt = new Date();
    order.statusHistory.push({ status, note });

    await order.save();

    if (order.user?.email) {
      sendOrderStatusEmail({
        user: order.user,
        order,
        note: note || (trackingNumber ? `Tracking number: ${trackingNumber}` : ''),
      }).catch((mailErr) => {
        console.error('[order-status-email] Failed to send:', mailErr.message);
      });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Request a return/refund for an order
// @route   POST /api/orders/:id/return-request
exports.requestReturn = async (req, res) => {
  try {
    const { reason = '', details = '' } = req.body;

    if (!reason.trim()) {
      return res.status(400).json({ success: false, message: 'Return reason is required' });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isOwner = order.user?._id?.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to request a return for this order' });
    }

    if (order.orderStatus !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Returns can only be requested for delivered orders' });
    }

    if (order.paymentInfo?.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Only paid orders are eligible for refunds' });
    }

    if (!isReturnWindowOpen(order)) {
      return res.status(400).json({ success: false, message: 'The 7-day return window has expired for this order' });
    }

    if (order.returnRequest?.status === 'requested') {
      return res.status(400).json({ success: false, message: 'A return request is already pending for this order' });
    }

    if (order.returnRequest?.status === 'refunded') {
      return res.status(400).json({ success: false, message: 'This order has already been refunded' });
    }

    order.returnRequest = {
      ...order.returnRequest?.toObject?.(),
      status: 'requested',
      reason: reason.trim(),
      details: details.trim(),
      requestedAt: new Date(),
      requestedBy: req.user._id,
      reviewedAt: undefined,
      reviewedBy: undefined,
      adminNote: '',
      refundAmount: Number(order.totalPrice) || 0,
      refundId: '',
      refundedAt: undefined,
    };
    order.orderStatus = 'Return Requested';
    order.statusHistory.push({ status: 'Return Requested', note: reason.trim() });

    await order.save();

    if (order.user?.email) {
      sendOrderStatusEmail({
        user: order.user,
        order,
        note: `Return request received. Reason: ${reason.trim()}`,
      }).catch((mailErr) => {
        console.error('[return-request-email] Failed to send:', mailErr.message);
      });
    }

    res.json({ success: true, order, message: 'Return request submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Review a return/refund request
// @route   PUT /api/orders/:id/return-request
exports.reviewReturnRequest = async (req, res) => {
  try {
    const { action, adminNote = '', refundAmount } = req.body;
    const normalizedAction = String(action || '').toLowerCase();

    if (!['approve', 'reject'].includes(normalizedAction)) {
      return res.status(400).json({ success: false, message: 'Invalid return action' });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.returnRequest?.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'There is no pending return request for this order' });
    }

    if (normalizedAction === 'reject') {
      order.returnRequest.status = 'rejected';
      order.returnRequest.reviewedAt = new Date();
      order.returnRequest.reviewedBy = req.user._id;
      order.returnRequest.adminNote = adminNote.trim();
      order.orderStatus = 'Delivered';
      order.statusHistory.push({ status: 'Delivered', note: adminNote.trim() || 'Return request rejected' });

      await order.save();

      if (order.user?.email) {
        sendOrderStatusEmail({
          user: order.user,
          order,
          note: adminNote.trim() || 'Your return request was reviewed and could not be approved.',
        }).catch((mailErr) => {
          console.error('[return-rejected-email] Failed to send:', mailErr.message);
        });
      }

      return res.json({ success: true, order, message: 'Return request rejected' });
    }

    if (order.paymentInfo?.status !== 'paid' || !order.paymentInfo?.razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'A paid Razorpay transaction is required to process the refund' });
    }

    const finalRefundAmount = normalizeRefundAmount(refundAmount, order.totalPrice);
    if (!finalRefundAmount) {
      return res.status(400).json({ success: false, message: 'Refund amount must be greater than zero' });
    }

    const refund = await getRazorpayClient().payments.refund(order.paymentInfo.razorpayPaymentId, {
      amount: Math.round(finalRefundAmount * 100),
      notes: {
        orderId: String(order._id),
        reason: order.returnRequest.reason || 'Customer return request',
      },
      speed: 'normal',
    });

    order.paymentInfo.status = 'refunded';
    order.paymentInfo.refundedAt = new Date();
    order.returnRequest.status = 'refunded';
    order.returnRequest.reviewedAt = new Date();
    order.returnRequest.reviewedBy = req.user._id;
    order.returnRequest.adminNote = adminNote.trim();
    order.returnRequest.refundAmount = finalRefundAmount;
    order.returnRequest.refundId = refund?.id || '';
    order.returnRequest.refundedAt = new Date();
    order.orderStatus = 'Refunded';
    order.statusHistory.push({
      status: 'Refunded',
      note: adminNote.trim() || `Refund processed for Rs ${finalRefundAmount.toLocaleString('en-IN')}`,
    });

    await restockOrderItems(order);
    await order.save();

    if (order.user?.email) {
      sendOrderStatusEmail({
        user: order.user,
        order,
        note: adminNote.trim() || `Your refund of Rs ${finalRefundAmount.toLocaleString('en-IN')} has been processed.`,
      }).catch((mailErr) => {
        console.error('[refund-processed-email] Failed to send:', mailErr.message);
      });
    }

    res.json({ success: true, order, refund, message: 'Refund processed successfully' });
  } catch (err) {
    const message = err?.error?.description || err.message || 'Failed to review return request';
    res.status(500).json({ success: false, message });
  }
};
