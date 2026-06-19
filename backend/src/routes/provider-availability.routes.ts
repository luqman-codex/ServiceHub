import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { RoleName } from '../types/enums';
import { idParam, providerIdParam } from '../validators/common.validator';
import {
  createAvailability,
  listAvailability,
  publicAvailQuery,
  updateAvailability,
} from '../validators/provider-availability.validator';
import { availabilityController } from '../controllers/provider-availability.controller';

const router = Router();

// 39 — GET /provider-availability — PROVIDER (own) / ADMIN (any via ?provider_id=)
router.get(
  '/provider-availability',
  authenticate,
  authorize(RoleName.PROVIDER, RoleName.ADMIN),
  validate(listAvailability),
  availabilityController.list,
);

// 40 — POST /provider-availability — PROVIDER (own) / ADMIN (via body provider_id)
router.post(
  '/provider-availability',
  authenticate,
  authorize(RoleName.PROVIDER, RoleName.ADMIN),
  validate(createAvailability),
  availabilityController.create,
);

// 41 — PATCH /provider-availability/:id — PROVIDER (own) / ADMIN (any)
router.patch(
  '/provider-availability/:id',
  authenticate,
  authorize(RoleName.PROVIDER, RoleName.ADMIN),
  validate({ params: idParam, ...updateAvailability }),
  availabilityController.update,
);

// 42 — DELETE /provider-availability/:id — PROVIDER (own) / ADMIN (any) → 204
router.delete(
  '/provider-availability/:id',
  authenticate,
  authorize(RoleName.PROVIDER, RoleName.ADMIN),
  validate({ params: idParam }),
  availabilityController.delete,
);

// 43 — GET /providers/:providerId/availability — PUBLIC (no auth)
router.get(
  '/providers/:providerId/availability',
  validate({ params: providerIdParam, ...publicAvailQuery }),
  availabilityController.listPublic,
);

export default router;
