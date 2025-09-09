const { Client } = require('@elastic/elasticsearch');

class ElasticsearchService {
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      maxRetries: 5,
      requestTimeout: 60000,
      sniffOnStart: true
    });
    this.indexName = 'products';
  }


  async search({
    query,
    filters = {},
    category,
    supplier,
    minPrice,
    maxPrice,
    sortBy = 'sales_total_sold',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  }) {
    try {
      const searchBody = {
        query: {
          bool: {
            must: [],
            filter: []
          }
        },
        sort: [],
        from: (page - 1) * limit,
        size: limit
      };

      // Text search
      if (query && query.trim()) {
        searchBody.query.bool.must.push({
          multi_match: {
            query: query.trim(),
            fields: ['name^2', 'description', 'brand^1.5'],
            type: 'best_fields',
            tie_breaker: 0.3,
            minimum_should_match: '70%'
          }
        });
      }

      // Category filter
      if (category) {
        searchBody.query.bool.filter.push({
          term: { category_id: category }
        });
      }

      // Supplier filter
      if (supplier) {
        searchBody.query.bool.filter.push({
          term: { supplier_id: supplier }
        });
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        const priceRange = {
          range: {
            price: {}
          }
        };

        if (minPrice !== undefined) {
          priceRange.range.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
          priceRange.range.price.lte = maxPrice;
        }

        searchBody.query.bool.filter.push(priceRange);
      }

      // Attribute filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() && key !== 'brand') {
          searchBody.query.bool.filter.push({
            term: {
              [`attributes.${key}`]: value.trim()
            }
          });
        }
      });

      // Brand filter
      if (filters.brand) {
        searchBody.query.bool.filter.push({
          term: { 'brand.keyword': filters.brand }
        });
      }

      // Sorting
      if (query && query.trim()) {
        searchBody.sort.unshift('_score');
      }

      searchBody.sort.push({
        [sortBy]: { order: sortOrder }
      });

      // Execute search
      const result = await this.client.search({
        index: this.indexName,
        body: searchBody
      });

      if (!result || !result.body || !result.body.hits) {
        console.error('Invalid search result structure:', result);
        throw new Error('Invalid Elasticsearch response structure');
      }

      return {
        products: result.body.hits.hits.map(hit => ({
          ...hit._source,
          score: hit._score
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.body.hits.total.value / limit),
          totalResults: result.body.hits.total.value,
          hasNextPage: (page * limit) < result.body.hits.total.value,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

}

module.exports = new ElasticsearchService();