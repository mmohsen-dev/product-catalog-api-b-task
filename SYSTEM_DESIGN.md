# Bosta Product Catalog Microservice - System Design Document

## Table of Contents

- [Executive Summary](#executive-summary)
- [Requirements Analysis](#requirements-analysis)
  - [Functional Requirements](#functional-requirements)
  - [System Limitations](#system-limitations)
  - [Non-Functional Requirements](#non-functional-requirements)
- [System Architecture](#system-architecture)
  - [High-Level Component Diagram](#high-level-component-diagram)
  - [Data Layer Components](#data-layer-components)
  - [Search API Data Flow](#search-api-data-flow)
- [Database Design](#database-design)
  - [MongoDB Schema (Source of Truth)](#mongodb-schema-source-of-truth)
  - [Products Collection](#products-collection)
  - [Categories Collection](#categories-collection)
  - [Suppliers Collection](#suppliers-collection)
- [Search Index Design](#search-index-design)
  - [Elasticsearch Mapping (products_v1)](#elasticsearch-mapping-productsv1)
- [Data Synchronization Strategy](#data-synchronization-strategy)
- [Infrastructure Design](#infrastructure-design)
- [Technical Questions & Answers](#technical-questions--answers)
  - [1. Alternative Ranking Strategies](#1-alternative-ranking-strategies)
  - [2. Product Relationship & Recommendations](#2-product-relationship--recommendations)
  - [3. Service Security Implementation](#3-service-security-implementation)
  - [4. Server Type Selection](#4-server-type-selection)

---

## Executive Summary

The Bosta Product Catalog Microservice is designed to handle product catalog storage and search functionality for a large-scale e-commerce platform. The system is engineered to support **50 million products** and **10 million monthly active users (MAUs)**, with a peak load of approximately **~230 search queries per second** (10 MAU × 10 searches ÷ 30 days ÷ 86,400 sec).

### Key Design Decisions

- **Polyglot Persistence**: Using the right tool for each job:

  - MongoDB: System of record ("source of truth")
  - Elasticsearch: Primary search engine for complex queries
  - Redis: Caching layer for frequently accessed data

- **Containerized & Orchestrated**: Dockerized deployment for scalability and portability
- **Best-Selling Ranking**: Default sorting by sales volume with configurable alternatives

## Requirements Analysis

### Functional Requirements

#### Product Catalog Management

- Support for product variants with different attributes
- Multiple product categories with hierarchical support
- Supplier management with product linking

#### Search Functionality

- REST API for product search
- Free text search across multiple attributes
- Filtering based on product/variant attributes
- Ranking based on business logic (best-selling initially)

### System Limitations

- Support 50 million products
- Handle 10 million monthly active users
- Process average 10 searches per user per month (~230 QPS peak)

### Non-Functional Requirements

- **Scalability**: Handle 50M+ products and ~230 QPS
- **Availability**: 99.9% uptime
- **Performance**: Sub-second response times for search queries
- **Extensibility**: Easy to modify ranking strategies and add features
- **Security**: Comprehensive access control and data protection

## System Architecture

### High-Level Component Diagram

```
                                🌐 CLIENT LAYER
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│    📱 Mobile Apps     💻 Web Apps     🔧 Admin Dashboard            │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
                    🚪 GATEWAY LAYER
┌─────────────────────────────────────────────────────────────────────┐
│                  ⚖️  Load Balancer (nginx)                          │
│                                                                     │
│              🛡️  API Gateway (Authentication & Rate Limiting)       │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
                   🔧 APPLICATION LAYER
┌─────────────────────────────────────────────────────────────────────┐
│                    Node.js Microservices                            │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐                          │
│  │  🔍 Search      │  │  📦 Product     │                          │
│  │    Service      │  │    Service      │                          │
│  │                 │  │                 │                          │
│  │ • Text Search   │  │ • CRUD Ops      │                          │
│  │ • Filtering     │  │ • Validation    │                          │
│  │ • Ranking       │  │ • Business      │                          │
│  │ • Caching       │  │   Logic         │                          │
│  └─────────────────┘  └─────────────────┘                          │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
                    💾 DATA LAYER
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   🍃 MongoDB    │  │  🔎 Elasticsearch│  │   ⚡ Redis      │     │
│  │                 │  │                 │  │                 │     │
│  │ 📄 Source of    │  │ 🔍 Search &     │  │ 🚀 Cache &      │     │
│  │   Truth         │  │   Analytics     │  │   Sessions      │     │
│  │                 │  │                 │  │                 │     │
│  │ • Products      │  │ • Full-text     │  │ • Query Cache   │     │
│  │ • Categories    │  │ • Faceted       │  │ • Session Data  │     │
│  │ • Suppliers     │  │ • Aggregations  │  │ • Rate Limits   │     │
│  │ • Users         │  │ • Analytics     │  │ • Hot Data      │     │
│  │                 │  │                 │  │                 │     │
│  │ 🔄 Replication  │  │ 🔄 Multi-node   │  │ 🔄 Clustering   │     │
│  │   (3 replicas)  │  │   (5 nodes)     │  │   (3 masters)   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘

                        🔄 DATA FLOW
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│     MongoDB          📨 Change         Elasticsearch                │
│   (Write Ops) ────────► Streams ────────► (Search Index)           │
│                                                                     │
│                          │                                          │
│                          ▼                                          │
│                     🔄 Event Bus                                    │
│                   (Real-time Sync)                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Layer Components

#### MongoDB (Primary Database)

- Stores product catalog data
- Handles CRUD operations
- Manages relationships between entities
- Primary-Secondary replication for high availability
- Sharding for horizontal scaling

#### Elasticsearch (Search Engine)

- Optimizes full-text search operations
- Handles complex attribute filtering
- Manages search ranking and scoring
- Distributed across multiple nodes for scalability
- Near real-time indexing of product updates

#### Redis (Caching Layer)

- Caches frequently accessed products
- Stores search results for popular queries
- Maintains best-seller rankings
- Cluster mode for high availability
- Data persistence for reliability

### Search API Data Flow

1. **Request**: Client sends search request to API Gateway
2. **Routing**: Request routed to Node.js API server
3. **Cache Check**: SearchService checks Redis for cached results
4. **Query Execution**: If not cached, constructs and sends query to Elasticsearch
5. **Search & Rank**: Elasticsearch executes query and ranks results
6. **Result Hydration**: Service fetches full product details from MongoDB for top results
7. **Cache Population**: Final result stored in Redis with TTL
8. **Response**: Formatted JSON response returned to client

## Database Design

### MongoDB Schema (Source of Truth)

#### Products Collection

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Classic V-Neck T-Shirt",
  description: "A comfortable classic cotton t-shirt.",
  categoryId: ObjectId("666f1f77bcf86cd799439022"),
  supplierId: ObjectId("555f1f77bcf86cd799439033"),
  brand: "Bosta",
  tags: ["casual", "cotton", "summer"],
  attributes: [
    { name: "material", value: "Cotton" }
  ],
  variants: [
    {
      sku: "BOS-TS-RD-S-V",
      attributes: [
        { name: "color", value: "Red" },
        { name: "size", value: "Small" },
        { name: "neckType", value: "V-Neck" }
      ],
      price: {
        amount: 1999,
        currency: "EGP"
      },
      inventory: {
        available: 100
      },
      salesData: {
        totalSold: 1500
      },
      imageUrls: ["https://cdn.bosta.com/images/bos-ts-rd-s-v-1.jpg"]
    }
  ],
  isActive: true,
  createdAt: ISODate("2023-10-01T08:15:30Z"),
  updatedAt: ISODate("2023-10-01T08:15:30Z")
}
```

**Indexes:**

```javascript
{ categoryId: 1 }
{ supplierId: 1 }
{ "variants.sku": 1 }, { unique: true }
{ "variants.attributes.value": 1 }
{ "salesMetrics.totalSold": -1 }
```

#### Categories Collection

```javascript
{
  _id: ObjectId("666f1f77bcf86cd799439022"),
  name: "Men's Fashion",
  slug: "mens-fashion",
  description: "All clothing and accessories for men.",
  parentId: ObjectId("777f1f77bcf86cd799439077"),
  path: "777f1f77bcf86cd799439077/666f1f77bcf86cd799439022",
  isActive: true,
  attributes: [
    { name: "color", type: "text" },
    { name: "size", type: "text" },
    { name: "material", type: "text" }
  ],
  createdAt: ISODate("2023-10-05T08:15:30Z"),
  updatedAt: ISODate("2023-10-05T08:15:30Z")
}
```

**Indexes:**

```javascript
{ slug: 1 }, { unique: true }
{ parentId: 1 }
{ path: 1 }
```

#### Suppliers Collection

```javascript
{
  _id: ObjectId("555f1f77bcf86cd799439033"),
  name: "Textile Egypt Inc.",
  contact: {
    email: "orders@textile-egypt.com",
    phone: "+20 123 456 7890"
  },
  address: {
    street: "123 Nile Corniche",
    city: "Cairo",
    country: "Egypt"
  },
  isActive: true,
  createdAt: ISODate("2023-09-15T08:15:30Z"),
  updatedAt: ISODate("2023-09-15T08:15:30Z")
}
```

**Indexes:**

```javascript
{ name: 1 }
{ "contact.email": 1 }, { unique: true }
```

## Search Index Design

### Elasticsearch Mapping (products_v1)

The search index is variant-centric, meaning each document represents a single purchasable SKU.

```json
{
  "settings": {
    "number_of_shards": 5,
    "number_of_replicas": 2,
    "analysis": {
      "analyzer": {
        "custom_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "asciifolding",
            "word_delimiter_graph",
            "stop",
            "snowball"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "product_id": { "type": "keyword" },
      "sku": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "custom_analyzer",
        "boost": 2.0,
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "custom_analyzer"
      },
      "category_id": { "type": "keyword" },
      "category_name": { "type": "keyword" },
      "supplier_id": { "type": "keyword" },
      "supplier_name": { "type": "keyword" },
      "brand": {
        "type": "text",
        "analyzer": "custom_analyzer",
        "boost": 1.5,
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "attributes.color": { "type": "keyword" },
      "attributes.size": { "type": "keyword" },
      "attributes.neckType": { "type": "keyword" },
      "attributes.storage": { "type": "keyword" },
      "attributes.screen": { "type": "keyword" },
      "attributes.platform": { "type": "keyword" },
      "attributes.type": { "type": "keyword" },
      "attributes.genre": { "type": "keyword" },
      "attributes.weight": { "type": "keyword" },
      "attributes.packaging": { "type": "keyword" },
      "price": {
        "type": "scaled_float",
        "scaling_factor": 100
      },
      "inventory_available": { "type": "integer" },
      "sales_total_sold": { "type": "integer" },
      "view_count": { "type": "integer" },
      "review_score": { "type": "half_float" }
    }
  }
}
```

## Data Synchronization Strategy

To maintain consistency between MongoDB and Elasticsearch, we implement a resilient Change Data Capture (CDC) pattern:

1. **Change Capture**: A service listens to MongoDB Change Streams on the products collection
2. **Event Publication**: All changes are published as structured events to a Kafka topic
3. **Indexing**: A consumer service processes these events and updates the Elasticsearch index

**Benefits:**

- Decouples the main API from indexing workload
- Provides resilience through message buffering
- Enables auditability of all changes

## Infrastructure Design

### Server Components

#### API Servers

- **Instance Type**: CPU-Optimized
- **Quantity**: 3-12 instances (Auto-scaled)
- **Rationale**: Optimized for Node.js workloads
  - Heavy JSON processing
  - Concurrent async operations
  - Query composition and transformation

#### MongoDB Cluster

- **Instance Type**: Memory-Optimized
- **Quantity**: 3+ nodes (Primary + Replicas)
- **Rationale**: Performance-critical operations
  - Large working set must fit in RAM
  - Heavy index utilization
  - Frequent data access patterns

#### Elasticsearch Cluster

- **Instance Type**: Balanced
- **Quantity**: 3+ Master nodes, 5+ Data nodes
- **Rationale**: Multi-resource workload
  - JVM heap for search operations
  - CPU for query processing & scoring
  - NVMe SSD for segment management
  - Distributed search coordination

#### Redis Cluster

- **Instance Type**: Memory-Optimized
- **Quantity**: 3+ nodes (Cluster Mode)
- **Rationale**: In-memory performance
  - Sub-millisecond response times
  - Session data storage
  - Frequent cache operations
  - Real-time analytics

### Deployment Architecture

- Containerized deployment using Docker
- Orchestrated with Kubernetes for automated scaling and management
- Multi-region deployment with load balancing
- Database replication for high availability
- Comprehensive monitoring with Prometheus and Grafana

## Technical Questions & Answers

### 1. Alternative Ranking Strategies

**For most viewed items:**

- Implement event tracking for product views
- Create a streaming pipeline (Kafka) to capture view events
- Aggregate counts and update Elasticsearch in near real-time
- Use view_count field as primary ranking signal

**For best reviewed:**

- Collect reviews/ratings through a dedicated service
- Calculate aggregate scores and reliability metrics
- Feed scores into Elasticsearch via the CDC pipeline
- Combine text relevance with review scores in search queries

### 2. Product Relationship & Recommendations

**For linking relevant products across suppliers:**

- Attribute Standardization: Implement a clustering service to normalize attributes
- Similarity Matching: Use Elasticsearch's More Like This query or ML-based recommendations

### 3. Service Security Implementation

**Comprehensive security approach:**

- Authentication & Authorization: JWT validation with central identity provider
- API Rate Limiting: Global and per-user limits at API Gateway
- Input Sanitization: Strict validation against injection attacks
- Network Security: Private VPC, TLS for all inter-service communication
- Secrets Management: HashiCorp Vault or AWS Secrets Manager for credentials
- Vulnerability Scanning: Integrated into CI/CD pipeline for dependencies

### 4. Server Type Selection

**API Servers (CPU-Optimized):**

- Heavy text processing and JSON serialization/deserialization
- Concurrent request handling with async operations
- Query building and composition

**Database Servers (Memory-Optimized):**

- Large working set size (50M+ products)
- Index-heavy operations requiring RAM caching
- Frequent data access patterns
- MongoDB performance directly tied to available memory

**Elasticsearch Servers (Balanced):**

- Requires balance of RAM for JVM heap and filesystem cache
- CPU for query execution and scoring
- Fast NVMe SSD storage for segment management
