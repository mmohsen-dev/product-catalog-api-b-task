require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import routes
const searchRoutes = require('./routes/searchRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(logger);

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalRateLimit);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version
  });
});

// API routes
app.use('/api/search', searchRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Bosta Product Catalog API',
    version: require('../package.json').version,
    description: 'Product catalog microservice with advanced search capabilities',
    endpoints: {
      search: {
        'GET /api/search/products': 'Search products with filters and ranking'
      },
      system: {
        'GET /health': 'Health check endpoint',
        'GET /api/docs': 'API documentation'
      }
    },
    examples: {
      basicSearch: '/api/search/products?q=t-shirt&category=fashion&page=1&limit=20',
      attributeSearch: '/api/search/products?color=red&size=medium&sortBy=sales_total_sold',
      priceFilter: '/api/search/products?minPrice=10&maxPrice=100&sortBy=price&sortOrder=asc'
    }
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
async function connectToDatabase() {
  try {
    const mongoOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    };

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bosta_catalog', mongoOptions);
    console.log('✅ Connected to MongoDB');

    // Create indexes on startup
    await createIndexes();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create database indexes
async function createIndexes() {
  try {
    const Product = require('./models/Product');
    const Category = require('./models/Category');
    const Supplier = require('./models/Supplier');

    // Ensure text index exists for search
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

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.warn('⚠️  Warning: Could not create indexes:', error.message);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Received SIGTERM, shutting down gracefully...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
async function startServer() {
  try {
    await connectToDatabase();
    
    app.listen(PORT, () => {
      console.log('🚀 Bosta Product Catalog Service Started');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      console.log('📊 Search Examples:');
      console.log(`   • Basic search: http://localhost:${PORT}/api/search/products?q=shirt`);
      console.log(`   • Attribute search: http://localhost:${PORT}/api/search/products?color=red&size=medium`);
      console.log(`   • Price filter: http://localhost:${PORT}/api/search/products?minPrice=10&maxPrice=100`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  startServer();
}

module.exports = app; 