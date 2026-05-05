require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');

const sampleProducts = [
  {
    title: 'Whispers of the Ancient Forest',
    description: 'A mesmerizing exploration of light filtering through ancient trees, painted with layered oil glazes that create a luminous depth. This piece captures the spiritual essence of old-growth forests and the passage of time through natural forms.',
    artist: 'Alangudi Subramaniam',
    artistBio: 'Alangudi Subramaniam is a Chennai-based artist whose work bridges the ancient and the contemporary, drawing from Tamil heritage and universal human experience.',
    price: 45000,
    originalPrice: 52000,
    category: 'Painting',
    medium: 'Oil on Canvas',
    dimensions: { width: 90, height: 120, unit: 'cm' },
    images: [
      { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', alt: 'Whispers of the Ancient Forest' },
    ],
    stock: 1,
    isFeatured: true,
    year: 2023,
    style: 'Impressionism',
    tags: ['forest', 'nature', 'light', 'spiritual'],
  },
  {
    title: 'Feminine Geometry',
    description: 'Celebrating the sacred geometry of the feminine form, this painting uses bold lines and earth tones to create a dialogue between abstraction and figuration. The silhouette series that defined the ARTT visual identity.',
    artist: 'Alangudi Subramaniam',
    price: 38000,
    category: 'Painting',
    medium: 'Acrylic on Canvas',
    dimensions: { width: 60, height: 80, unit: 'cm' },
    images: [
      { url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800', alt: 'Feminine Geometry' },
    ],
    stock: 1,
    isFeatured: true,
    year: 2024,
    style: 'Abstract',
    tags: ['women', 'geometry', 'abstract', 'silhouette'],
  },
  {
    title: 'Golden Hour at Marina',
    description: 'A luminous watercolor capturing the famous Marina Beach at dusk, where the Bay of Bengal meets the sky in a symphony of gold and amber. This piece evokes the timeless rhythm of Chennai\'s most beloved landmark.',
    artist: 'Priya Krishnamurthy',
    artistBio: 'Priya Krishnamurthy specializes in coastal landscapes and urban poetry through watercolor.',
    price: 22000,
    category: 'Painting',
    medium: 'Watercolor on Paper',
    dimensions: { width: 50, height: 35, unit: 'cm' },
    images: [
      { url: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800', alt: 'Golden Hour at Marina' },
    ],
    stock: 2,
    isFeatured: true,
    year: 2023,
    style: 'Realism',
    tags: ['beach', 'sunset', 'Chennai', 'watercolor'],
  },
  {
    title: 'Urban Solitude',
    description: 'A photographic exploration of solitude in the modern city. Shot during the blue hour, this limited edition print captures architectural symmetry and the human condition in urban spaces.',
    artist: 'Ravi Chandran',
    price: 15000,
    category: 'Photography',
    medium: 'Fine Art Print',
    dimensions: { width: 70, height: 50, unit: 'cm' },
    images: [
      { url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800', alt: 'Urban Solitude' },
    ],
    stock: 5,
    isLimited: true,
    year: 2024,
    style: 'Contemporary',
    tags: ['urban', 'photography', 'architecture', 'monochrome'],
  },
  {
    title: 'Terracotta Goddess',
    description: 'Hand-sculpted in traditional Tamil Nadu terracotta, this sculpture draws from Pallava dynasty motifs and reimagines the divine feminine for contemporary spaces. Each piece is unique and signed.',
    artist: 'Meena Rajan',
    price: 65000,
    category: 'Sculpture',
    medium: 'Terracotta',
    dimensions: { width: 25, height: 45, depth: 20, unit: 'cm' },
    images: [
      { url: 'https://images.unsplash.com/photo-1604076913837-52ab5629fde4?w=800', alt: 'Terracotta Goddess' },
    ],
    stock: 1,
    isFeatured: true,
    year: 2023,
    style: 'Traditional Contemporary',
    tags: ['sculpture', 'terracotta', 'goddess', 'Tamil Nadu'],
  },
  {
    title: 'Digital Mandala Series I',
    description: 'A fusion of sacred geometry and digital artistry, this limited edition print explores the intersection of ancient spiritual patterns and contemporary visual language. Available as museum-quality Giclée print.',
    artist: 'Karthik Selvam',
    price: 8500,
    category: 'Digital Art',
    medium: 'Giclée Print',
    dimensions: { width: 60, height: 60, unit: 'cm' },
    images: [
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', alt: 'Digital Mandala' },
    ],
    stock: 10,
    isLimited: true,
    year: 2024,
    style: 'Digital',
    tags: ['mandala', 'digital', 'geometry', 'spiritual'],
  },
  {
    title: 'Monsoon Memories',
    description: 'Mixed media work combining oil paint, tissue paper, and natural pigments to evoke the sensory experience of the South Indian monsoon. The layered texture creates depth that changes with the light.',
    artist: 'Alangudi Subramaniam',
    price: 55000,
    category: 'Mixed Media',
    medium: 'Oil, tissue, natural pigments',
    dimensions: { width: 100, height: 80, unit: 'cm' },
    images: [
      { url: 'https://images.unsplash.com/photo-1573521193826-58c7dc2e13e3?w=800', alt: 'Monsoon Memories' },
    ],
    stock: 1,
    isFeatured: true,
    year: 2024,
    style: 'Abstract Expressionism',
    tags: ['monsoon', 'mixed media', 'texture', 'India'],
  },
  {
    title: 'Kolam at Dawn',
    description: 'A photorealistic drawing series celebrating the ancient art of Kolam – the geometric rice flour patterns drawn at Tamil doorsteps each morning. This intricate work uses graphite and gold leaf.',
    artist: 'Deepa Nair',
    price: 18000,
    category: 'Drawing',
    medium: 'Graphite and gold leaf on paper',
    dimensions: { width: 40, height: 40, unit: 'cm' },
    images: [
      { url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800', alt: 'Kolam at Dawn' },
    ],
    stock: 3,
    year: 2023,
    style: 'Hyperrealism',
    tags: ['kolam', 'Tamil culture', 'drawing', 'gold'],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    const admin = await User.create({
      name: 'Admin ARTT',
      email: 'admin@artt.in',
      password: 'Admin@123',
      role: 'admin',
    });
    console.log(`✅ Admin created: admin@artt.in / Admin@123`);

    // Create test user
    await User.create({
      name: 'Test User',
      email: 'user@artt.in',
      password: 'User@123',
    });
    console.log(`✅ Test user created: user@artt.in / User@123`);

    // Create products
    for (const productData of sampleProducts) {
      await Product.create(productData);
    }
    console.log(`✅ ${sampleProducts.length} products seeded`);

    console.log('\n🎨 ARTT database seeded successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();