const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Admin dashboard analytics
// @route   GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueData] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { 'paymentInfo.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, 'paymentInfo.status': 'paid' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(5);

    // Top products
    const topProducts = await Order.aggregate([
      { $unwind: '$orderItems' },
      { $group: { _id: '$orderItems.product', title: { $first: '$orderItems.title' }, count: { $sum: 1 }, revenue: { $sum: '$orderItems.price' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueData[0]?.total || 0,
      },
      monthlyRevenue,
      recentOrders,
      topProducts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNumber = Number(page);
    const pageLimit = Number(limit);
    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort('-createdAt')
      .limit(pageLimit)
      .skip((pageNumber - 1) * pageLimit)
      .lean();

    const userIds = users.map((user) => user._id);
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          recentOrders: {
            $push: {
              _id: '$_id',
              totalPrice: '$totalPrice',
              orderStatus: '$orderStatus',
              paymentStatus: '$paymentInfo.status',
              createdAt: '$createdAt',
            },
          },
        },
      },
    ]);

    const statsByUserId = new Map(
      orderStats.map((stat) => [
        stat._id.toString(),
        {
          orderCount: stat.orderCount,
          totalSpent: stat.totalSpent,
          recentOrders: stat.recentOrders.slice(0, 5),
        },
      ])
    );

    const usersWithOrders = users.map((user) => {
      const stats = statsByUserId.get(user._id.toString());
      return {
        ...user,
        orderCount: stats?.orderCount || 0,
        totalSpent: stats?.totalSpent || 0,
        recentOrders: stats?.recentOrders || [],
      };
    });

    res.json({ success: true, users: usersWithOrders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
