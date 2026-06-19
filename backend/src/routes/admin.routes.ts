import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { RoleName } from '../types/enums';
import { bookingStatsQuery } from '../validators/admin.validator';
import * as adminController from '../controllers/admin.controller';

/**
 * Admin Dashboard & Stats routes (02 §8.8, 03 §13 rows 44–45).
 * Full sub-paths begin right after /api/v1; routes/index.ts mounts this router
 * at the /api/v1 root via `router.use(adminRouter)`.
 */
const router = Router();

// Row 44 — GET /admin/stats
router.get(
  '/admin/stats',
  authenticate,
  authorize(RoleName.ADMIN),
  adminController.stats,
);

// Row 45 — GET /admin/stats/bookings
router.get(
  '/admin/stats/bookings',
  authenticate,
  authorize(RoleName.ADMIN),
  validate(bookingStatsQuery),
  adminController.bookingStats,
);

export default router;
