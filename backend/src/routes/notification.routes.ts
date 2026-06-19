import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { idParam } from '../validators/common.validator';
import { listNotifications } from '../validators/notification.validator';
import * as notificationController from '../controllers/notification.controller';

/**
 * Notification routes (02 §8.10, 03 §13 rows 50–53).
 *
 * Full sub-paths under /api/v1 (mounted at the root in routes/index.ts). Every
 * route requires authentication; own-record ownership is enforced in the service
 * layer (notificationService.listOwn/markRead/markAllRead/deleteOwn).
 *
 * Ordering note: the STATIC path "/notifications/read-all" is registered BEFORE
 * the PARAM path "/notifications/:id/read" so "read-all" is not captured as :id.
 */
const router = Router();

// 50 — GET /notifications
router.get('/notifications', authenticate, validate(listNotifications), notificationController.list);

// 52 — PATCH /notifications/read-all (static — MUST precede /:id/read)
router.patch('/notifications/read-all', authenticate, notificationController.markAllRead);

// 51 — PATCH /notifications/:id/read
router.patch(
  '/notifications/:id/read',
  authenticate,
  validate({ params: idParam }),
  notificationController.markRead,
);

// 53 — DELETE /notifications/:id
router.delete(
  '/notifications/:id',
  authenticate,
  validate({ params: idParam }),
  notificationController.remove,
);

export default router;
