import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for login attempts
 * 5 requests per 15 minutes
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Çok fazla giriş denemesi yapıldı, 15 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Rate limiter for file uploads
 * 20 uploads per 15 minutes
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: 'Çok fazla dosya yükleme denemesi, lütfen bekleyin.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
