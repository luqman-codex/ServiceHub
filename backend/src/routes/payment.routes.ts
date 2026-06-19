import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { RoleName } from '../types/enums';
import { idParam } from '../validators/common.validator';
import { createPayment, listPayments } from '../validators/payment.validator';
import * as paymentController from '../controllers/payment.controller';

/**
 * Payment routes (03 §13 rows 46–49). Full sub-paths beginning right after
 * /api/v1; mounted at the /api/v1 root in routes/index.ts. Ownership (CUSTOMER
 * own-booking only) for rows 46–47 is enforced in the service layer (03 §8.3, §13 footnote).
 */
const router = Router();

// 46 — POST /bookings/:id/payment  (CUSTOMER own booking, ADMIN any)
router.post(
  '/bookings/:id/payment',
  authenticate,
  authorize(RoleName.CUSTOMER, RoleName.ADMIN),
  validate({ params: idParam, body: createPayment.body }),
  paymentController.create,
);

// 47 — GET /bookings/:id/payment  (CUSTOMER own booking, ADMIN any)
router.get(
  '/bookings/:id/payment',
  authenticate,
  authorize(RoleName.CUSTOMER, RoleName.ADMIN),
  validate({ params: idParam }),
  paymentController.getForBooking,
);

// 48 — GET /payments  (ADMIN)
router.get(
  '/payments',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ query: listPayments.query }),
  paymentController.list,
);

// 49 — GET /payments/:id  (ADMIN)
router.get(
  '/payments/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam }),
  paymentController.getById,
);

export default router;
