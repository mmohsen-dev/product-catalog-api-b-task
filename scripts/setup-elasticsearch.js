const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// Sample dataset that matches our requirements
const sampleProducts = [
  {
    product_id: '1',
    sku: 'TSHIRT-RED-S-V',
    name: 'Classic V-Neck T-Shirt',
    description: 'Comfortable cotton V-neck t-shirt in various colors and sizes',
    category_id: 'fashion_1',
    category_name: 'Fashion',
    supplier_id: 'sup_1',
    supplier_name: 'Fashion Basics Co',
    brand: 'ComfortWear',
    'attributes.color': 'Red',
    'attributes.size': 'Small',
    'attributes.neckType': 'V-Neck',
    price: 2499, // $24.99 (scaled by 100)
    inventory_available: 150,
    sales_total_sold: 500,
    view_count: 1200,
    review_score: 4.5
  },
  {
    product_id: '2',
    sku: 'TSHIRT-GREEN-M-R',
    name: 'Classic Round Neck T-Shirt',
    description: 'Comfortable cotton round neck t-shirt perfect for daily wear',
    category_id: 'fashion_1',
    category_name: 'Fashion',
    supplier_id: 'sup_2',
    supplier_name: 'Style Masters',
    brand: 'ComfortWear',
    'attributes.color': 'Green',
    'attributes.size': 'Medium',
    'attributes.neckType': 'Round',
    price: 1999, // $19.99
    inventory_available: 200,
    sales_total_sold: 350,
    view_count: 800,
    review_score: 4.2
  },
  {
    product_id: '3',
    sku: 'PHONE-BLK-128',
    name: 'SmartPhone Pro Max',
    description: 'Latest smartphone with advanced features and great camera',
    category_id: 'electronics_1',
    category_name: 'Electronics',
    supplier_id: 'sup_3',
    supplier_name: 'Tech Giants Inc',
    brand: 'TechPro',
    'attributes.color': 'Black',
    'attributes.storage': '128GB',
    'attributes.screen': '6.7inch',
    price: 99900, // $999.00
    inventory_available: 50,
    sales_total_sold: 1200,
    view_count: 5000,
    review_score: 4.8
  },
  {
    product_id: '4',
    sku: 'GAME-PS5-DIG',
    name: 'Adventure Quest 2023',
    description: 'Epic adventure game with stunning graphics',
    category_id: 'games_1',
    category_name: 'Video Games',
    supplier_id: 'sup_4',
    supplier_name: 'Game Masters',
    brand: 'GameStudios',
    'attributes.platform': 'PS5',
    'attributes.type': 'Digital',
    'attributes.genre': 'Adventure',
    price: 5999, // $59.99
    inventory_available: 1000,
    sales_total_sold: 750,
    view_count: 3000,
    review_score: 4.6
  },
  {
    product_id: '5',
    sku: 'GROC-ORG-1KG',
    name: 'Organic Oranges',
    description: 'Fresh organic oranges, perfect for juicing',
    category_id: 'grocery_1',
    category_name: 'Groceries',
    supplier_id: 'sup_5',
    supplier_name: 'Fresh Foods Inc',
    brand: 'OrganicFresh',
    'attributes.weight': '1KG',
    'attributes.type': 'Organic',
    'attributes.packaging': 'Mesh Bag',
    price: 599, // $5.99
    inventory_available: 300,
    sales_total_sold: 2500,
    view_count: 1500,
    review_score: 4.3
  }
];

// Generate more variants of T-shirts
const tShirtVariants = [
  { color: 'Red', size: 'Medium', neckType: 'V-Neck', price: 2499 },
  { color: 'Red', size: 'Large', neckType: 'V-Neck', price: 2499 },
  { color: 'Blue', size: 'Small', neckType: 'Round', price: 1999 },
  { color: 'Blue', size: 'Medium', neckType: 'Round', price: 1999 },
  { color: 'Green', size: 'Small', neckType: 'V-Neck', price: 2499 },
  { color: 'Black', size: 'Medium', neckType: 'Round', price: 1999 },
  { color: 'White', size: 'Large', neckType: 'V-Neck', price: 2499 }
].map((variant, index) => ({
  product_id: `1_${index + 2}`,
  sku: `TSHIRT-${variant.color.toUpperCase()}-${variant.size[0]}-${variant.neckType[0]}`,
  name: `Classic ${variant.neckType} T-Shirt`,
  description: `Comfortable cotton ${variant.neckType.toLowerCase()} t-shirt in ${variant.color.toLowerCase()}`,
  category_id: 'fashion_1',
  category_name: 'Fashion',
  supplier_id: 'sup_1',
  supplier_name: 'Fashion Basics Co',
  brand: 'ComfortWear',
  'attributes.color': variant.color,
  'attributes.size': variant.size,
  'attributes.neckType': variant.neckType,
  price: variant.price,
  inventory_available: 100 + Math.floor(Math.random() * 200),
  sales_total_sold: Math.floor(Math.random() * 1000),
  view_count: Math.floor(Math.random() * 2000),
  review_score: (3.5 + Math.random()).toFixed(1)
}));

// Index settings and mappings
const productIndex = {
  settings: {
    number_of_shards: 5,
    number_of_replicas: 2,
    analysis: {
      analyzer: {
        custom_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: [
            'lowercase',
            'asciifolding',
            'word_delimiter_graph',
            'stop',
            'snowball'
          ]
        }
      }
    }
  },
  mappings: {
    properties: {
      product_id: { type: "keyword" },
      sku: { type: "keyword" },
      name: { 
        type: "text", 
        analyzer: "custom_analyzer", 
        boost: 2.0,
        fields: { 
          keyword: { 
            type: "keyword" 
          } 
        }
      },
      description: { 
        type: "text", 
        analyzer: "custom_analyzer" 
      },
      category_id: { type: "keyword" },
      category_name: { type: "keyword" },
      supplier_id: { type: "keyword" },
      supplier_name: { type: "keyword" },
      brand: { 
        type: "text", 
        analyzer: "custom_analyzer",
        boost: 1.5,
        fields: { 
          keyword: { 
            type: "keyword" 
          } 
        }
      },
      "attributes.color": { type: "keyword" },
      "attributes.size": { type: "keyword" },
      "attributes.neckType": { type: "keyword" },
      "attributes.storage": { type: "keyword" },
      "attributes.screen": { type: "keyword" },
      "attributes.platform": { type: "keyword" },
      "attributes.type": { type: "keyword" },
      "attributes.genre": { type: "keyword" },
      "attributes.weight": { type: "keyword" },
      "attributes.packaging": { type: "keyword" },
      price: { 
        type: "scaled_float", 
        scaling_factor: 100 
      },
      inventory_available: { type: "integer" },
      sales_total_sold: { type: "integer" },
      view_count: { type: "integer" },
      review_score: { type: "half_float" }
    }
  }
};

async function setupElasticsearch() {
  try {
    // Check if index exists
    const indexExists = await client.indices.exists({
      index: 'products'
    });

    if (indexExists) {
      console.log('Deleting existing products index...');
      try {
        await client.indices.delete({
          index: 'products'
        });
      } catch (error) {
        console.log('Index deletion failed (probably doesn\'t exist):', error.message);
      }
    }

    // Create index with settings and mappings
    console.log('Creating products index...');
    await client.indices.create({
      index: 'products',
      body: productIndex
    });

    // Bulk index the sample data
    const allProducts = [...sampleProducts, ...tShirtVariants];
    console.log(`Indexing ${allProducts.length} products...`);

    const operations = allProducts.flatMap(doc => [
      { index: { _index: 'products' } },
      doc
    ]);

    const bulkResponse = await client.bulk({
      refresh: true,
      body: operations
    });

    if (bulkResponse.body.errors) {
      const erroredDocuments = [];
      bulkResponse.body.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            operation: operations[i * 2],
            document: operations[i * 2 + 1]
          });
        }
      });
      console.error('Bulk indexing errors:', erroredDocuments);
    }

    // Verify the indexed documents
    const countResponse = await client.count({ index: 'products' });
    const count = countResponse.body.count;
    console.log(`Successfully indexed ${count} documents`);

    // Create aliases
    console.log('Creating aliases...');
    await client.indices.putAlias({
      index: 'products',
      name: 'products-read'
    });

    console.log('Elasticsearch setup completed successfully');

  } catch (error) {
    console.error('Error setting up Elasticsearch:', error);
    process.exit(1);
  }
}

// Execute setup
if (require.main === module) {
  setupElasticsearch()
    .then(() => {
      console.log('Setup completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = {
  setupElasticsearch
};