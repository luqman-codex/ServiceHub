import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { RoleName } from '../types/enums';
import { idParam, includeQuery } from '../validators/common.validator';
import {
  createBooking,
  listBookings,
  updateBooking,
  reasonBody,
  adminSetStatus,
  assign,
} from '../validators/booking.validator';
import * as bookingController from '../controllers/booking.controller';

const router = Router();

// row 28 — POST /bookings
router.post(
  '/bookings',
  authenticate,
  authorize(RoleName.CUSTOMER, RoleName.ADMIN),
  validate(createBooking),
  bookingController.create,
);

// row 29 — GET /bookings (role-scoped list)
router.get('/bookings', authenticate, validate(listBookings), bookingController.list);

// row 30 — GET /bookings/:id
router.get(
  '/bookings/:id',
  authenticate,
  validate({ params: idParam, query: includeQuery }),
  bookingController.getById,
);

// row 31 — PATCH /bookings/:id (edit mutable details)
router.patch(
  '/bookings/:id',
  authenticate,
  authorize(RoleName.CUSTOMER, RoleName.ADMIN),
  validate({ params: idParam, body: updateBooking.body }),
  bookingController.update,
);

// rows 32-36 — state-transition actions (ownership enforced in the service)
router.post(
  '/bookings/:id/accept',
  authenticate,
  authorize(RoleName.PROVIDER, RoleName.ADMIN),
  validate({ params: idParam }),
  bookingController.accept,
);
router.post(
  '/bookings/:id/reject',
  authenticate,
  authorize(RoleName.PROVIDER, RoleName.ADMIN),
  validate({ params: idParam, body: reasonBody.body }),
  bookingController.reject,
);
router.post(
  '/bookings/:id/start',
  authenticate,
  authorize(RoleName.PROVIDER, RoleName.ADMIN),
  validate({ params: idParam }),
  bookingController.start,
);
router.post(
  '/bookings/:id/complete',
  authenticate,
  authorize(RoleName.PROVIDER, RoleName.ADMIN),
  validate({ params: idParam }),
  bookingController.complete,
);
router.post(
  '/bookings/:id/cancel',
  authenticate,
  authorize(RoleName.CUSTOMER, RoleName.ADMIN),
  validate({ params: idParam, body: reasonBody.body }),
  bookingController.cancel,
);

// row 37 — PATCH /bookings/:id/status (admin generic transition)
router.patch(
  '/bookings/:id/status',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam, body: adminSetStatus.body }),
  bookingController.setStatus,
);

// row 38 — PATCH /bookings/:id/assign (admin set/reassign provider)
router.patch(
  '/bookings/:id/assign',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam, body: assign.body }),
  bookingController.assign,
);

export default router;
