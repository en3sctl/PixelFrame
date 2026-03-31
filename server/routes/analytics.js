import express from 'express';
import { trackEvent, getSummary } from '../controllers/analyticsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public — tracking endpoint (no auth needed)
router.post('/track', trackEvent);

// Admin — get summary stats
router.get('/summary', verifyToken, getSummary);

export default router;
