require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Supplier = require('../src/models/Supplier');

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bosta_catalog');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Supplier.deleteMany({})
    ]);

    // Create categories
    console.log('📂 Creating categories...');
    const categories = await Category.create([
      {
        name: 'Fashion',
        description: 'Clothing and fashion accessories',
        level: 0
      },
      {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        level: 0
      },
      {
        name: 'Video Games',
        description: 'Video games and gaming accessories',
        level: 0
      },
      {
        name: 'Groceries',
        description: 'Food and grocery items',
        level: 0
      }
    ]);

    const fashionCategory = categories.find(c => c.name === 'Fashion');
    const electronicsCategory = categories.find(c => c.name === 'Electronics');
    const gamesCategory = categories.find(c => c.name === 'Video Games');
    const groceriesCategory = categories.find(c => c.name === 'Groceries');

    // Create suppliers
    console.log('🏪 Creating suppliers...');
    const suppliers = await Supplier.create([
      {
        name: 'Fashion Hub',
        email: 'contact@fashionhub.com',
        phone: '+1234567890',
        address: {
          street: '123 Fashion Street',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        },
        isActive: true,
        verification: { isVerified: true, verifiedAt: new Date() },
        rating: { average: 4.5, count: 150 }
      },
      {
        name: 'Tech Solutions',
        email: 'sales@techsolutions.com',
        phone: '+1234567891',
        address: {
          street: '456 Tech Avenue',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          zipCode: '94105'
        },
        isActive: true,
        verification: { isVerified: true, verifiedAt: new Date() },
        rating: { average: 4.8, count: 320 }
      },
      {
        name: 'Game World',
        email: 'info@gameworld.com',
        phone: '+1234567892',
        address: {
          street: '789 Gaming Blvd',
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          zipCode: '90210'
        },
        isActive: true,
        verification: { isVerified: true, verifiedAt: new Date() },
        rating: { average: 4.3, count: 89 }
      },
      {
        name: 'Fresh Market',
        email: 'orders@freshmarket.com',
        phone: '+1234567893',
        address: {
          street: '321 Market Street',
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
          zipCode: '60601'
        },
        isActive: true,
        verification: { isVerified: true, verifiedAt: new Date() },
        rating: { average: 4.2, count: 203 }
      }
    ]);

    const fashionSupplier = suppliers.find(s => s.name === 'Fashion Hub');
    const techSupplier = suppliers.find(s => s.name === 'Tech Solutions');
    const gameSupplier = suppliers.find(s => s.name === 'Game World');
    const grocerySupplier = suppliers.find(s => s.name === 'Fresh Market');

    // Create sample products
    console.log('🛍️ Creating sample products...');
    
    // Fashion Products
    const fashionProducts = [
      {
        name: 'Classic T-Shirt',
        description: 'Comfortable cotton t-shirt perfect for everyday wear',
        category: fashionCategory._id,
        supplier: fashionSupplier._id,
        brand: 'ComfortWear',
        baseAttributes: new Map([
          ['material', 'Cotton'],
          ['season', 'All Season']
        ]),
        variants: [
          {
            sku: 'TSHIRT-RED-S-VNECK',
            attributes: new Map([
              ['color', 'Red'],
              ['size', 'Small'],
              ['neckType', 'V-Neck']
            ]),
            price: { amount: 25.99, currency: 'USD' },
            inventory: { quantity: 100, reserved: 5, available: 95 },
            images: [{ url: '/images/tshirt-red-s-vneck.jpg', alt: 'Red Small V-Neck T-Shirt', isPrimary: true }],
            salesData: { totalSold: 250, totalRevenue: 6497.50, lastSaleDate: new Date() }
          },
          {
            sku: 'TSHIRT-RED-M-VNECK',
            attributes: new Map([
              ['color', 'Red'],
              ['size', 'Medium'],
              ['neckType', 'V-Neck']
            ]),
            price: { amount: 25.99, currency: 'USD' },
            inventory: { quantity: 150, reserved: 10, available: 140 },
            images: [{ url: '/images/tshirt-red-m-vneck.jpg', alt: 'Red Medium V-Neck T-Shirt', isPrimary: true }],
            salesData: { totalSold: 380, totalRevenue: 9876.20, lastSaleDate: new Date() }
          },
          {
            sku: 'TSHIRT-GREEN-M-ROUND',
            attributes: new Map([
              ['color', 'Green'],
              ['size', 'Medium'],
              ['neckType', 'Rounded-Neck']
            ]),
            price: { amount: 23.99, currency: 'USD' },
            inventory: { quantity: 75, reserved: 3, available: 72 },
            images: [{ url: '/images/tshirt-green-m-round.jpg', alt: 'Green Medium Round-Neck T-Shirt', isPrimary: true }],
            salesData: { totalSold: 120, totalRevenue: 2878.80, lastSaleDate: new Date() }
          },
          {
            sku: 'TSHIRT-GREEN-S-VNECK',
            attributes: new Map([
              ['color', 'Green'],
              ['size', 'Small'],
              ['neckType', 'V-Neck']
            ]),
            price: { amount: 25.99, currency: 'USD' },
            inventory: { quantity: 60, reserved: 2, available: 58 },
            images: [{ url: '/images/tshirt-green-s-vneck.jpg', alt: 'Green Small V-Neck T-Shirt', isPrimary: true }],
            salesData: { totalSold: 95, totalRevenue: 2469.05, lastSaleDate: new Date() }
          }
        ],
        tags: ['casual', 'everyday', 'cotton', 'comfortable'],
        salesMetrics: { averageRating: 4.3, reviewCount: 156 },
        analytics: { viewCount: 1250 }
      },
      {
        name: 'Premium Jeans',
        description: 'High-quality denim jeans with modern fit',
        category: fashionCategory._id,
        supplier: fashionSupplier._id,
        brand: 'DenimCraft',
        baseAttributes: new Map([
          ['material', 'Denim'],
          ['fit', 'Slim Fit']
        ]),
        variants: [
          {
            sku: 'JEANS-BLUE-30-SLIM',
            attributes: new Map([
              ['color', 'Blue'],
              ['size', '30'],
              ['fit', 'Slim']
            ]),
            price: { amount: 79.99, currency: 'USD' },
            inventory: { quantity: 45, reserved: 8, available: 37 },
            images: [{ url: '/images/jeans-blue-30-slim.jpg', alt: 'Blue Slim Jeans Size 30', isPrimary: true }],
            salesData: { totalSold: 180, totalRevenue: 14398.20, lastSaleDate: new Date() }
          },
          {
            sku: 'JEANS-BLACK-32-SLIM',
            attributes: new Map([
              ['color', 'Black'],
              ['size', '32'],
              ['fit', 'Slim']
            ]),
            price: { amount: 84.99, currency: 'USD' },
            inventory: { quantity: 30, reserved: 5, available: 25 },
            images: [{ url: '/images/jeans-black-32-slim.jpg', alt: 'Black Slim Jeans Size 32', isPrimary: true }],
            salesData: { totalSold: 95, totalRevenue: 8074.05, lastSaleDate: new Date() }
          }
        ],
        tags: ['denim', 'jeans', 'premium', 'slim-fit'],
        salesMetrics: { averageRating: 4.6, reviewCount: 89 },
        analytics: { viewCount: 890 }
      }
    ];

    // Electronics Products
    const electronicsProducts = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        category: electronicsCategory._id,
        supplier: techSupplier._id,
        brand: 'AudioTech',
        baseAttributes: new Map([
          ['connectivity', 'Bluetooth 5.0'],
          ['batteryLife', '30 hours']
        ]),
        variants: [
          {
            sku: 'HEADPHONES-BLACK-PREMIUM',
            attributes: new Map([
              ['color', 'Black'],
              ['model', 'Premium']
            ]),
            price: { amount: 199.99, currency: 'USD' },
            inventory: { quantity: 80, reserved: 12, available: 68 },
            images: [{ url: '/images/headphones-black-premium.jpg', alt: 'Black Premium Wireless Headphones', isPrimary: true }],
            salesData: { totalSold: 420, totalRevenue: 83996.00, lastSaleDate: new Date() }
          },
          {
            sku: 'HEADPHONES-WHITE-STANDARD',
            attributes: new Map([
              ['color', 'White'],
              ['model', 'Standard']
            ]),
            price: { amount: 149.99, currency: 'USD' },
            inventory: { quantity: 60, reserved: 8, available: 52 },
            images: [{ url: '/images/headphones-white-standard.jpg', alt: 'White Standard Wireless Headphones', isPrimary: true }],
            salesData: { totalSold: 280, totalRevenue: 41997.20, lastSaleDate: new Date() }
          }
        ],
        tags: ['wireless', 'bluetooth', 'headphones', 'audio', 'noise-cancellation'],
        salesMetrics: { averageRating: 4.7, reviewCount: 234 },
        analytics: { viewCount: 2150 }
      }
    ];

    // Video Game Products
    const gameProducts = [
      {
        name: 'Adventure Quest RPG',
        description: 'Epic fantasy role-playing game with stunning graphics',
        category: gamesCategory._id,
        supplier: gameSupplier._id,
        brand: 'GameStudio',
        baseAttributes: new Map([
          ['platform', 'Multi-platform'],
          ['genre', 'RPG']
        ]),
        variants: [
          {
            sku: 'GAME-RPG-PC-DIGITAL',
            attributes: new Map([
              ['platform', 'PC'],
              ['format', 'Digital Download']
            ]),
            price: { amount: 59.99, currency: 'USD' },
            inventory: { quantity: 1000, reserved: 50, available: 950 },
            images: [{ url: '/images/game-rpg-pc-digital.jpg', alt: 'Adventure Quest RPG PC Digital', isPrimary: true }],
            salesData: { totalSold: 1200, totalRevenue: 71988.00, lastSaleDate: new Date() }
          },
          {
            sku: 'GAME-RPG-CONSOLE-PHYSICAL',
            attributes: new Map([
              ['platform', 'Console'],
              ['format', 'Physical Copy']
            ]),
            price: { amount: 69.99, currency: 'USD' },
            inventory: { quantity: 200, reserved: 25, available: 175 },
            images: [{ url: '/images/game-rpg-console-physical.jpg', alt: 'Adventure Quest RPG Console Physical', isPrimary: true }],
            salesData: { totalSold: 450, totalRevenue: 31495.50, lastSaleDate: new Date() }
          }
        ],
        tags: ['rpg', 'adventure', 'fantasy', 'multiplayer'],
        salesMetrics: { averageRating: 4.8, reviewCount: 892 },
        analytics: { viewCount: 5600 }
      }
    ];

    // Grocery Products
    const groceryProducts = [
      {
        name: 'Organic Apples',
        description: 'Fresh organic apples from local farms',
        category: groceriesCategory._id,
        supplier: grocerySupplier._id,
        brand: 'FreshFarms',
        baseAttributes: new Map([
          ['organic', 'true'],
          ['origin', 'Local Farms']
        ]),
        variants: [
          {
            sku: 'APPLES-ORGANIC-1LB',
            attributes: new Map([
              ['weight', '1 lb'],
              ['type', 'Red Delicious']
            ]),
            price: { amount: 4.99, currency: 'USD' },
            inventory: { quantity: 500, reserved: 20, available: 480 },
            images: [{ url: '/images/apples-organic-1lb.jpg', alt: 'Organic Red Delicious Apples 1lb', isPrimary: true }],
            salesData: { totalSold: 850, totalRevenue: 4241.50, lastSaleDate: new Date() }
          },
          {
            sku: 'APPLES-ORGANIC-3LB',
            attributes: new Map([
              ['weight', '3 lb'],
              ['type', 'Granny Smith']
            ]),
            price: { amount: 12.99, currency: 'USD' },
            inventory: { quantity: 200, reserved: 15, available: 185 },
            images: [{ url: '/images/apples-organic-3lb.jpg', alt: 'Organic Granny Smith Apples 3lb', isPrimary: true }],
            salesData: { totalSold: 320, totalRevenue: 4156.80, lastSaleDate: new Date() }
          }
        ],
        tags: ['organic', 'fresh', 'fruit', 'healthy', 'local'],
        salesMetrics: { averageRating: 4.4, reviewCount: 156 },
        analytics: { viewCount: 980 }
      }
    ];

    // Create all products
    const allProducts = [...fashionProducts, ...electronicsProducts, ...gameProducts, ...groceryProducts];
    const createdProducts = await Product.create(allProducts);

    // Note: Elasticsearch indexing is handled separately by setup:es

    console.log('✅ Sample data created successfully');
    console.log(`📊 Created ${categories.length} categories`);
    console.log(`🏪 Created ${suppliers.length} suppliers`);
    console.log(`🛍️ Created ${allProducts.length} products`);

    // Create indexes
    console.log('🔧 Creating indexes...');
    await Product.collection.createIndex(
      { 
        name: 'text', 
        description: 'text', 
        tags: 'text', 
        brand: 'text' 
      },
      { 
        name: 'product_text_search',
        weights: {
          name: 10,
          brand: 8,
          tags: 5,
          description: 1
        }
      }
    );
    console.log('✅ Indexes created successfully');

    console.log('\n🎉 Database setup complete!');
    console.log('\nSample API calls to test:');
    console.log('• Search for t-shirts: GET /api/search/products?q=t-shirt');
    console.log('• Filter by color: GET /api/search/products?color=red');
    console.log('• Filter by category: GET /api/search/products?category=' + fashionCategory._id);
    console.log('• Price range: GET /api/search/products?minPrice=20&maxPrice=50');
    console.log('• Best selling: GET /api/search/products?sortBy=salesMetrics.totalSold&sortOrder=desc');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

setupDatabase(); 