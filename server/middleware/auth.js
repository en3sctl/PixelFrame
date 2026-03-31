import jwt from 'jsonwebtoken';

/**
 * Verify JWT token middleware
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Yetkilendirme token\'ı bulunamadı' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token süresi dolmuş',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Geçersiz token' 
    });
  }
};

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};
