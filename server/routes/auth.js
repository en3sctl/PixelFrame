import express from 'express';
import { login, refresh, logout, getMe } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { validateLogin } from '../middleware/validate.js';

const router = express.Router();

// Public routes
router.post('/login', loginLimiter, validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', verifyToken, getMe);

export default router;
