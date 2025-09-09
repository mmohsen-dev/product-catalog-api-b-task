const ElasticsearchService = require('../services/ElasticsearchService');
const Joi = require('joi');

class SearchController {
  /**
   * Search products with various filters and ranking
   * GET /api/search/products
   */
  async searchProducts(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        q: Joi.string().trim().max(200).default(''),
        query: Joi.string().trim().max(200).default(''),
        category: Joi.string().trim(),
        supplier: Joi.string().trim(),
        brand: Joi.string().trim().max(100),
        minPrice: Joi.number().min(0),
        maxPrice: Joi.number().min(0),
        sortBy: Joi.string().valid(
          'sales_total_sold',
          'view_count',
          'review_score',
          'createdAt',
          'name',
          'price'
        ).default('sales_total_sold'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        // Dynamic attribute filters
        color: Joi.string().trim(),
        size: Joi.string().trim(),
        material: Joi.string().trim(),
        style: Joi.string().trim(),
        neckType: Joi.string().trim()
      }).unknown(true); // Allow additional attribute filters

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          error: error.details[0].message
        });
      }

      // Use 'q' or 'query' parameter for search term
      const searchQuery = value.q || value.query || '';
      
      // Extract attribute filters (any parameter not in the base schema)
      const baseParams = [
        'q', 'query', 'category', 'supplier', 'brand', 'minPrice', 'maxPrice',
        'sortBy', 'sortOrder', 'page', 'limit'
      ];
      
      const filters = {};
      Object.entries(value).forEach(([key, val]) => {
        if (!baseParams.includes(key) && val) {
          filters[key] = val;
        }
      });

      // Add brand to filters if specified
      if (value.brand) {
        filters.brand = value.brand;
      }

      const searchParams = {
        query: searchQuery,
        filters,
        category: value.category,
        supplier: value.supplier,
        minPrice: value.minPrice,
        maxPrice: value.maxPrice,
        sortBy: value.sortBy,
        sortOrder: value.sortOrder,
        page: value.page,
        limit: value.limit
      };

      const results = await ElasticsearchService.search(searchParams);

      res.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Search service unavailable'
      });
    }
  }
}

module.exports = new SearchController(); 