const Product = require('../models/Product');

// @desc    Get all products with filters
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const {
      keyword, category, artist, minPrice, maxPrice,
      sort = '-createdAt', page = 1, limit = 12, featured,
    } = req.query;

    const query = {};
    if (keyword) {
      const k = keyword.trim();
      // Use case-insensitive regex search across common text fields so partial
      // and mixed-case queries (e.g. "arjun" or "Arjun") match reliably.
      query.$or = [
        { title: { $regex: k, $options: 'i' } },
        { artist: { $regex: k, $options: 'i' } },
        { description: { $regex: k, $options: 'i' } },
        { tags: { $elemMatch: { $regex: k, $options: 'i' } } },
      ];
    }
    if (category) query.category = category;
    if (artist) query.artist = { $regex: artist, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (featured === 'true') query.isFeatured = true;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      success: true,
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create product (Admin)
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add review
// @route   POST /api/products/:id/reviews
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) return res.status(400).json({ success: false, message: 'Already reviewed' });

    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
    product.calcAverageRating();
    await product.save();
    res.status(201).json({ success: true, message: 'Review added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get categories + artists
// @route   GET /api/products/meta
exports.getMeta = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const artists = await Product.distinct('artist');
    const priceRange = await Product.aggregate([
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]);
    res.json({ success: true, categories, artists, priceRange: priceRange[0] || { min: 0, max: 100000 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};