const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  attributes: {
    type: Map,
    of: String,
    required: true
    // e.g., { "color": "Red", "size": "Small", "neckType": "V-Neck" }
  },
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    }
  },
  inventory: {
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    },
    available: {
      type: Number,
      default: function() {
        return this.quantity - this.reserved;
      }
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  salesData: {
    totalSold: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    lastSaleDate: Date
  }
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },
  baseAttributes: {
    type: Map,
    of: String
    // Common attributes across all variants
  },
  variants: [variantSchema],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'draft'],
    default: 'public'
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  analytics: {
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    searchCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastViewed: Date
  },
  salesMetrics: {
    totalSold: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  collection: 'products'
});

// Indexes for search and performance optimization
productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ isActive: 1, visibility: 1 });
productSchema.index({ 'salesMetrics.totalSold': -1 }); // For best-selling ranking
productSchema.index({ 'analytics.viewCount': -1 });
productSchema.index({ 'salesMetrics.averageRating': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ 'variants.isActive': 1 });

// Compound indexes for complex queries
productSchema.index({ category: 1, 'salesMetrics.totalSold': -1 });
productSchema.index({ supplier: 1, isActive: 1 });
productSchema.index({ 'variants.attributes': 1, 'salesMetrics.totalSold': -1 });

// Virtual for active variants
productSchema.virtual('activeVariants').get(function() {
  return this.variants.filter(variant => variant.isActive);
});

// Virtual for total inventory
productSchema.virtual('totalInventory').get(function() {
  return this.variants.reduce((total, variant) => total + variant.inventory.available, 0);
});

// Method to get lowest price variant
productSchema.methods.getLowestPrice = function() {
  const activeVariants = this.activeVariants;
  if (activeVariants.length === 0) return null;
  
  return Math.min(...activeVariants.map(variant => variant.price.amount));
};

// Method to get highest price variant
productSchema.methods.getHighestPrice = function() {
  const activeVariants = this.activeVariants;
  if (activeVariants.length === 0) return null;
  
  return Math.max(...activeVariants.map(variant => variant.price.amount));
};

// Method to update sales metrics
productSchema.methods.updateSalesMetrics = async function() {
  const totalSold = this.variants.reduce((sum, variant) => sum + variant.salesData.totalSold, 0);
  const totalRevenue = this.variants.reduce((sum, variant) => sum + variant.salesData.totalRevenue, 0);
  
  this.salesMetrics.totalSold = totalSold;
  this.salesMetrics.totalRevenue = totalRevenue;
  
  return this.save();
};

// Pre-save middleware to update computed fields
productSchema.pre('save', function(next) {
  // Update product-level sales metrics from variants
  this.salesMetrics.totalSold = this.variants.reduce((sum, variant) => sum + variant.salesData.totalSold, 0);
  this.salesMetrics.totalRevenue = this.variants.reduce((sum, variant) => sum + variant.salesData.totalRevenue, 0);
  
  next();
});

module.exports = mongoose.model('Product', productSchema); 