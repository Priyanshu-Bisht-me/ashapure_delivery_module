import { Router } from 'express';
import { getCurrentUser, login, signup } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, getCurrentUser);

export default router;
