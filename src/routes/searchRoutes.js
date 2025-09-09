const express = require('express');
const rateLimit = require('express-rate-limit');
const SearchController = require('../controllers/SearchController');

const router = express.Router();

// Rate limiting for search endpoints
const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many search requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});


// Search routes
router.get('/products', searchRateLimit, SearchController.searchProducts);

module.exports = router; 