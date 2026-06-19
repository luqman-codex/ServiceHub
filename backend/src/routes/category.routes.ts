import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { RoleName } from '../types/enums';
import { idParam } from '../validators/common.validator';
import {
  createCategory,
  listCategories,
  updateCategory,
} from '../validators/category.validator';
import * as categoryController from '../controllers/category.controller';

/**
 * Category routes (03 §13 rows 17–21). FULL sub-paths beginning right after /api/v1.
 * Mounted at the /api/v1 root by routes/index.ts. GET endpoints are public;
 * create/update/delete require authenticate + authorize(ADMIN). DELETE is a soft delete.
 */
const router = Router();

// 17 — GET /categories (public)
router.get('/categories', validate(listCategories), categoryController.list);

// 18 — GET /categories/:id (public)
router.get('/categories/:id', validate({ params: idParam }), categoryController.getById);

// 19 — POST /categories (ADMIN)
router.post(
  '/categories',
  authenticate,
  authorize(RoleName.ADMIN),
  validate(createCategory),
  categoryController.create,
);

// 20 — PATCH /categories/:id (ADMIN)
router.patch(
  '/categories/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam, body: updateCategory.body }),
  categoryController.update,
);

// 21 — DELETE /categories/:id (ADMIN, soft delete)
router.delete(
  '/categories/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam }),
  categoryController.softDelete,
);

export default router;
