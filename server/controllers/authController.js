import bcrypt from 'bcryptjs';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} from '../middleware/auth.js';

// Store refresh tokens (in production, use Redis or database)
const refreshTokens = new Set();

/**
 * Admin login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check credentials against environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminUsername || !adminPassword) {
      console.error('Admin credentials not configured');
      return res.status(500).json({
        success: false,
        message: 'Sunucu yapılandırma hatası'
      });
    }
    
    // Verify username
    if (username !== adminUsername) {
      // Use same error message for security (don't reveal if username exists)
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre'
      });
    }
    
    // Verify password (comparing with hashed password from env)
    const isValidPassword = await bcrypt.compare(password, adminPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre'
      });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken('admin');
    const refreshToken = generateRefreshToken('admin');
    
    // Store refresh token
    refreshTokens.add(refreshToken);
    
    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token gerekli'
      });
    }
    
    // Check if refresh token exists
    if (!refreshTokens.has(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz refresh token'
      });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      refreshTokens.delete(refreshToken);
      return res.status(401).json({
        success: false,
        message: 'Refresh token süresi dolmuş'
      });
    }
    
    // Generate new access token
    const accessToken = generateAccessToken(decoded.userId);
    
    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

/**
 * Logout
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }
    
    res.json({
      success: true,
      message: 'Çıkış başarılı'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};

/**
 * Check auth status
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: 'admin',
      role: 'admin'
    }
  });
};
