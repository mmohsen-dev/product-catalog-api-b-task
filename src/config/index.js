require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bosta_catalog',
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    indices: {
      products: 'products'
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100
  },
  search: {
    defaultPageSize: 20,
    maxPageSize: 100
  }
};
