import express from 'express';
import multer from 'multer';
import {
  getProducts,
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts
} from '../controllers/productController.js';
import { verifyToken } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import { 
  validateProductCreate, 
  validateProductUpdate, 
  validateProductId 
} from '../middleware/validate.js';

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Only allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 10 // Max 10 files at once
  }
});

// Error handling for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu 5MB\'dan büyük olamaz'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'En fazla 10 dosya yüklenebilir'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Dosya yükleme hatası'
    });
  }
  
  if (err.message === 'Sadece resim dosyaları yüklenebilir') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Public routes
router.get('/', getProducts);
router.get('/:id', validateProductId, getProduct);

// Protected routes (admin only)
router.get('/admin/all', verifyToken, getAllProducts);

router.post(
  '/', 
  verifyToken, 
  uploadLimiter,
  upload.array('images', 10),
  handleMulterError,
  validateProductCreate, 
  createProduct
);

router.put(
  '/:id', 
  verifyToken, 
  uploadLimiter,
  upload.array('images', 10),
  handleMulterError,
  validateProductUpdate, 
  updateProduct
);

router.delete('/:id', verifyToken, validateProductId, deleteProduct);

router.put('/admin/reorder', verifyToken, reorderProducts);

export default router;
