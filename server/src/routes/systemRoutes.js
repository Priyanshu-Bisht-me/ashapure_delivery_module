import { Router } from 'express';
import { getHealth, seedDeliveries } from '../controllers/systemController.js';

const router = Router();

router.get('/health', getHealth);
router.post('/seed', seedDeliveries);

export default router;
