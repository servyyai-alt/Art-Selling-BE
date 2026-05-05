const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderPlacedEmail, sendOrderStatusEmail } = require('../services/emailService');

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
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
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
