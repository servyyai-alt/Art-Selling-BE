const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: String,
  artist: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [orderItemSchema],
    shippingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
      phone: String,
    },
    paymentInfo: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      paidAt: Date,
      refundedAt: Date,
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Return Requested', 'Refunded'],
      default: 'Processing',
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    deliveredAt: Date,
    trackingNumber: String,
    notes: String,
    returnRequest: {
      status: {
        type: String,
        enum: ['none', 'requested', 'rejected', 'refunded'],
        default: 'none',
      },
      reason: String,
      details: String,
      requestedAt: Date,
      reviewedAt: Date,
      adminNote: String,
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      refundAmount: { type: Number, default: 0 },
      refundId: String,
      refundedAt: Date,
      inventoryRestockedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
