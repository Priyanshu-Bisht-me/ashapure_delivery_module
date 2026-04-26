import { Router } from 'express';
import {
  createAdminDelivery,
  getAdminAgents,
  getAnalytics,
  getAssignedDeliveries,
  getDeliveryById,
  getTodaySummary,
  updateDeliveryStatus,
} from '../controllers/deliveryController.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/analytics', getAnalytics);
router.get('/summary', getTodaySummary);
router.get('/summary/today', getTodaySummary);
router.get('/deliveries', getAssignedDeliveries);
router.get('/admin/agents', requireAdmin, getAdminAgents);
router.post('/admin/deliveries', requireAdmin, createAdminDelivery);
router.get('/deliveries/:deliveryId', getDeliveryById);
router.put('/deliveries/:deliveryId/status', updateDeliveryStatus);
router.patch('/deliveries/:deliveryId/status', updateDeliveryStatus);

export default router;
