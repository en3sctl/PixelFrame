import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı zorunludur'],
    trim: true,
    maxlength: [100, 'Ürün adı 100 karakterden uzun olamaz']
  },
  category: {
    type: String,
    required: [true, 'Kategori zorunludur'],
    trim: true,
    maxlength: [50, 'Kategori 50 karakterden uzun olamaz']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Açıklama 500 karakterden uzun olamaz'],
    default: ''
  },
  images: {
    type: [imageSchema],
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'Bir ürün en fazla 10 resme sahip olabilir'
    },
    default: []
  },
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ order: 1, createdAt: -1 });
productSchema.index({ isActive: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
