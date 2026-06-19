import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { RoleName } from '../types/enums';
import { idParam, includeQuery } from '../validators/common.validator';
import {
  createService,
  listServices,
  updatePrice,
  updateService,
} from '../validators/service.validator';
import * as serviceController from '../controllers/service.controller';

/**
 * Service routes (02 §8.5; 03 §13 rows 22–27). Full sub-paths begin right after
 * `/api/v1`; mounted at the `/api/v1` root by `routes/index.ts`. GET endpoints are
 * public; writes require `authorize(ADMIN)`. Default-exports the Express Router.
 */
const router = Router();

// 22 — GET /services (public)
router.get('/services', validate(listServices), serviceController.list);

// 23 — GET /services/:id (public)
router.get(
  '/services/:id',
  validate({ params: idParam, query: includeQuery }),
  serviceController.getById,
);

// 24 — POST /services (ADMIN)
router.post(
  '/services',
  authenticate,
  authorize(RoleName.ADMIN),
  validate(createService),
  serviceController.create,
);

// 25 — PATCH /services/:id (ADMIN)
router.patch(
  '/services/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam, body: updateService.body }),
  serviceController.update,
);

// 26 — PATCH /services/:id/price (ADMIN)
router.patch(
  '/services/:id/price',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam, body: updatePrice.body }),
  serviceController.updatePrice,
);

// 27 — DELETE /services/:id (ADMIN, soft delete)
router.delete(
  '/services/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam }),
  serviceController.softDelete,
);

export default router;
