import { body, param, validationResult } from 'express-validator';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Doğrulama hatası',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Login validation rules
 */
export const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Kullanıcı adı zorunludur')
    .isLength({ max: 50 }).withMessage('Kullanıcı adı çok uzun'),
  body('password')
    .notEmpty().withMessage('Şifre zorunludur')
    .isLength({ max: 100 }).withMessage('Şifre çok uzun'),
  handleValidationErrors
];

/**
 * Product creation validation rules
 */
export const validateProductCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Ürün adı zorunludur')
    .isLength({ max: 100 }).withMessage('Ürün adı en fazla 100 karakter olabilir'),
  body('category')
    .trim()
    .notEmpty().withMessage('Kategori zorunludur')
    .isLength({ max: 50 }).withMessage('Kategori en fazla 50 karakter olabilir'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Açıklama en fazla 500 karakter olabilir'),
  body('featured')
    .optional()
    .customSanitizer(v => v === 'true' || v === true)
    .isBoolean().withMessage('Featured boolean olmalıdır'),
  body('order')
    .optional()
    .customSanitizer(v => parseInt(v) || 0)
    .isInt({ min: 0, max: 1000 }).withMessage('Sıralama 0-1000 arasında olmalıdır'),
  handleValidationErrors
];

/**
 * Product update validation rules
 */
export const validateProductUpdate = [
  param('id')
    .isMongoId().withMessage('Geçersiz ürün ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Ürün adı 1-100 karakter arasında olmalıdır'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Kategori 1-50 karakter arasında olmalıdır'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Açıklama en fazla 500 karakter olabilir'),
  body('featured')
    .optional()
    .customSanitizer(v => v === 'true' || v === true)
    .isBoolean().withMessage('Featured boolean olmalıdır'),
  body('order')
    .optional()
    .customSanitizer(v => parseInt(v) || 0)
    .isInt({ min: 0, max: 1000 }).withMessage('Sıralama 0-1000 arasında olmalıdır'),
  body('isActive')
    .optional()
    .customSanitizer(v => v === 'true' || v === true)
    .isBoolean().withMessage('isActive boolean olmalıdır'),
  handleValidationErrors
];

/**
 * Product ID validation
 */
export const validateProductId = [
  param('id')
    .isMongoId().withMessage('Geçersiz ürün ID'),
  handleValidationErrors
];
