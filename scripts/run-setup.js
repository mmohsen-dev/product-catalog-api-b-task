#!/usr/bin/env node
require('dotenv').config();

const { setupElasticsearch } = require('./setup-elasticsearch');

async function runSetup() {
  try {
    console.log('Starting Elasticsearch setup...');
    
    // Ensure we have the required environment variables
    if (!process.env.ELASTICSEARCH_URL) {
      console.warn('ELASTICSEARCH_URL not set, using default: http://localhost:9200');
    }

    // Run Elasticsearch setup
    await setupElasticsearch();
    
    console.log('✅ All setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
runSetup();