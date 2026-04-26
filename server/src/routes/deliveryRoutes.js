import { Router } from 'express';
import {
  getAnalytics,
  getAssignedDeliveries,
  getDeliveryById,
  getTodaySummary,
  updateDeliveryStatus,
} from '../controllers/deliveryController.js';

const router = Router();

router.get('/analytics', getAnalytics);
router.get('/summary', getTodaySummary);
router.get('/summary/today', getTodaySummary);
router.get('/deliveries', getAssignedDeliveries);
router.get('/deliveries/:deliveryId', getDeliveryById);
router.put('/deliveries/:deliveryId/status', updateDeliveryStatus);
router.patch('/deliveries/:deliveryId/status', updateDeliveryStatus);

export default router;
