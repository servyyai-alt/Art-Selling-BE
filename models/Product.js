const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    artist: { type: String, required: true, trim: true },
    artistBio: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number },
    category: {
      type: String,
      required: true,
      enum: ['Painting', 'Sculpture', 'Photography', 'Digital Art', 'Drawing', 'Mixed Media', 'Printmaking'],
    },
    medium: { type: String, default: '' }, // Oil, Acrylic, Watercolor, etc.
    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
      unit: { type: String, default: 'cm' },
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: String,
        alt: String,
      },
    ],
    stock: { type: Number, default: 1, min: 0 },
    isSold: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isLimited: { type: Boolean, default: false },
    tags: [String],
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    year: { type: Number },
    style: { type: String, default: '' }, // Abstract, Realism, etc.
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

// Generate slug before save
productSchema.pre('save', function (next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  next();
});

// Calculate average rating
productSchema.methods.calcAverageRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    this.rating = this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
    this.numReviews = this.reviews.length;
  }
};

// Full text search index
productSchema.index({ title: 'text', artist: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);