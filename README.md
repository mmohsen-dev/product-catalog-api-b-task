# Bosta Product Catalog API

A simple product catalog microservice with search functionality. Built with Node.js, MongoDB, and Elasticsearch.

## What it does

- Store products with different variants (colors, sizes, etc.)
- Search products by name, description, or brand
- Filter by attributes like color, size, price range
- Sort by sales, price, or ratings
- Pagination support

## Quick Start

1. **Clone and start**

   ```bash
   git clone https://github.com/mmohsen-dev/product-catalog-api-b-task.git
   cd product-catalog-api-b-task
   docker-compose up -d
   ```

2. **Wait for setup to complete**

3. **Test the API**

   ```bash
   # Check health
   curl http://localhost:3000/health

   # Search products
   curl "http://localhost:3000/api/search/products?q=shirt"
   ```

That's it! The setup script automatically creates sample data.

## Requirements

- Docker & Docker Compose
- 4GB RAM minimum

## API Examples

```bash
# Basic search
curl "http://localhost:3000/api/search/products?q=t-shirt"

# Filter by color and size
curl "http://localhost:3000/api/search/products?color=Red&size=Medium"

# Price range
curl "http://localhost:3000/api/search/products?minPrice=20&maxPrice=50"

# Sort by best-selling
curl "http://localhost:3000/api/search/products?sortBy=sales_total_sold&sortOrder=desc"

# Pagination
curl "http://localhost:3000/api/search/products?page=2&limit=10"
```

## Search Parameters

| Parameter   | Description       | Example                             |
| ----------- | ----------------- | ----------------------------------- |
| `q`         | Search text       | `shirt`, `headphones`               |
| `color`     | Filter by color   | `Red`, `Blue`                       |
| `size`      | Filter by size    | `Small`, `Large`                    |
| `brand`     | Filter by brand   | `ComfortWear`                       |
| `minPrice`  | Min price (cents) | `2000` (=$20)                       |
| `maxPrice`  | Max price (cents) | `5000` (=$50)                       |
| `sortBy`    | Sort field        | `sales_total_sold`, `price`, `name` |
| `sortOrder` | Sort direction    | `asc`, `desc`                       |
| `page`      | Page number       | `1`, `2`, `3`                       |
| `limit`     | Results per page  | `10`, `20` (max 100)                |

## Response Format

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "product_id": "1_2",
        "name": "Classic T-Shirt",
        "brand": "ComfortWear",
        "price": 2499,
        "attributes": {
          "color": "Red",
          "size": "Medium"
        },
        "sales_total_sold": 886
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalResults": 25
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Start databases only
docker-compose up -d mongodb elasticsearch

# Setup sample data
npm run setup:all

# Start in dev mode
npm run dev
```

## Services

When running, these services are available:

- **API**: http://localhost:3000
- **MongoDB**: localhost:27017
- **Elasticsearch**: http://localhost:9200
- **Mongo Express** (debug): http://localhost:8081 (admin/admin123)

## Project Structure

```
src/
├── app.js              # Main application
├── controllers/        # API controllers
├── models/             # Database models
├── services/          # Business logic
├── routes/            # API routes
└── middleware/        # Express middleware

scripts/
├── setup-database.js  # Creates sample data
└── setup-elasticsearch.js # Syncs to search
```

## Tech Stack

- **Node.js**: API server
- **MongoDB**: Product data storage
- **Elasticsearch**: Search engine
- **Express**: Web framework
- **Docker**: Easy deployment

## Sample Data

The setup automatically creates:

- 100+ sample products
- Categories (Fashion, Electronics, etc.)
- Suppliers
- Product variants with attributes

## Troubleshooting

**Services won't start?**

```bash
docker-compose down
docker-compose up -d
```

**No search results?**

```bash
# Rebuild search index
docker-compose run --rm setup npm run setup:es
```

**Check logs:**

```bash
docker-compose logs app
```

## Need Help?

- API docs: http://localhost:3000/api/docs
- Health check: http://localhost:3000/health
- System design: See [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)

Built with ❤️ for Bosta Technical Assessment
