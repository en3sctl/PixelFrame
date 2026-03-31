import Product from '../models/Product.js';
import { uploadImage, deleteImage, deleteImages } from '../utils/cloudinary.js';

/**
 * Get all products (public)
 * GET /api/products
 */
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler alınırken hata oluştu'
    });
  }
};

/**
 * Get all products including inactive (admin)
 * GET /api/products/all
 */
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler alınırken hata oluştu'
    });
  }
};

/**
 * Get single product
 * GET /api/products/:id
 */
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('-__v');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün alınırken hata oluştu'
    });
  }
};

/**
 * Create product
 * POST /api/products
 */
export const createProduct = async (req, res) => {
  try {
    const { name, category, description, featured, order } = req.body;
    
    // Handle uploaded images
    const images = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadImage(file.buffer, 'pixelframe/products');
          images.push({
            url: result.url,
            publicId: result.publicId
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          // Continue with other images
        }
      }
    }
    
    const product = await Product.create({
      name,
      category,
      description: description || '',
      featured: featured === 'true' || featured === true,
      order: parseInt(order) || 0,
      images
    });
    
    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün oluşturulurken hata oluştu'
    });
  }
};

/**
 * Update product
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res) => {
  try {
    const { name, category, description, featured, order, isActive, removeImages } = req.body;
    
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }
    
    // Remove specified images from Cloudinary
    if (removeImages) {
      const imagesToRemove = JSON.parse(removeImages);
      
      for (const publicId of imagesToRemove) {
        try {
          await deleteImage(publicId);
          product.images = product.images.filter(img => img.publicId !== publicId);
        } catch (deleteError) {
          console.error('Image delete error:', deleteError);
        }
      }
    }
    
    // Upload new images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (product.images.length >= 10) break; // Max 10 images
        
        try {
          const result = await uploadImage(file.buffer, 'pixelframe/products');
          product.images.push({
            url: result.url,
            publicId: result.publicId
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
    }
    
    // Update fields
    if (name) product.name = name;
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (featured !== undefined) product.featured = featured === 'true' || featured === true;
    if (order !== undefined) product.order = parseInt(order) || 0;
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün güncellenirken hata oluştu'
    });
  }
};

/**
 * Delete product
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }
    
    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      const publicIds = product.images.map(img => img.publicId);
      try {
        await deleteImages(publicIds);
      } catch (deleteError) {
        console.error('Bulk image delete error:', deleteError);
      }
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Ürün başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün silinirken hata oluştu'
    });
  }
};

/**
 * Reorder products
 * PUT /api/products/reorder
 */
export const reorderProducts = async (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, order }
    
    if (!Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sıralama verisi'
      });
    }
    
    const bulkOps = orders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { order }
      }
    }));
    
    await Product.bulkWrite(bulkOps);
    
    res.json({
      success: true,
      message: 'Sıralama güncellendi'
    });
  } catch (error) {
    console.error('Reorder products error:', error);
    res.status(500).json({
      success: false,
      message: 'Sıralama güncellenirken hata oluştu'
    });
  }
};

/**
 * Migrate old category names to new ones
 * POST /api/products/admin/migrate-categories
 */
export const migrateCategories = async (req, res) => {
  try {
    const mapping = {
      'Akıllı Aksesuar': 'Araç Aksesuarları',
      'Akilli Aksesuar': 'Araç Aksesuarları',
      'Aksesuar': 'Cüzdan & Aksesuar',
      'Koleksiyon': 'Uçak Maketleri',
      'Gaming': 'CS2 Koleksiyonu',
      'Kişiselleştirilebilir': 'Anahtarlık',
      'Kisisellestirilebilir': 'Anahtarlık'
    };

    let totalUpdated = 0;

    for (const [oldName, newName] of Object.entries(mapping)) {
      const result = await Product.updateMany(
        { category: oldName },
        { $set: { category: newName } }
      );
      totalUpdated += result.modifiedCount;
    }

    res.json({
      success: true,
      message: `${totalUpdated} ürünün kategorisi güncellendi`
    });
  } catch (error) {
    console.error('Migrate categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori güncellemesi sırasında hata oluştu'
    });
  }
};
