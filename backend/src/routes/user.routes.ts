import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { RoleName } from '../types/enums';
import { idParam } from '../validators/common.validator';
import {
  adminCreateUser,
  adminUpdateUser,
  listUsers,
  setRole,
  setStatus,
} from '../validators/user.validator';
import * as userController from '../controllers/user.controller';

/**
 * Users (admin) routes — rows 11–16 of 02 §5 / 03 §13.
 * FULL sub-paths beginning right after /api/v1 (mounted at the /api/v1 root in
 * routes/index.ts via router.use). Every endpoint is ADMIN-only.
 * Route-level middleware chains are byte-for-byte the 03 §13 "Mw" columns.
 */
const router = Router();

// 11 | GET /users
router.get(
  '/users',
  authenticate,
  authorize(RoleName.ADMIN),
  validate(listUsers),
  userController.list,
);

// 12 | POST /users
router.post(
  '/users',
  authenticate,
  authorize(RoleName.ADMIN),
  validate(adminCreateUser),
  userController.create,
);

// 13 | GET /users/:id
router.get(
  '/users/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam }),
  userController.getById,
);

// 14 | PATCH /users/:id
router.patch(
  '/users/:id',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam, body: adminUpdateUser.body }),
  userController.update,
);

// 15 | PATCH /users/:id/status
router.patch(
  '/users/:id/status',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam, body: setStatus.body }),
  userController.setStatus,
);

// 16 | PATCH /users/:id/role
router.patch(
  '/users/:id/role',
  authenticate,
  authorize(RoleName.ADMIN),
  validate({ params: idParam, body: setRole.body }),
  userController.setRole,
);

export default router;
