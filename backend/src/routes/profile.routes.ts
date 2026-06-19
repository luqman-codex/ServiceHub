import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { RoleName } from '../types/enums';
import {
  updateProfile,
  changePassword,
  getProviderProfile,
  upsertProviderProfile,
} from '../validators/profile.validator';
import * as profileController from '../controllers/profile.controller';

/**
 * Profile resource routes (03 §13 rows 6-10). Full sub-paths begin right after
 * `/api/v1`; routes/index.ts mounts this router at the `/api/v1` root.
 *
 * Ownership ("own record") for rows 6-10 is enforced inside the service layer
 * (operations target req.user); the route layer applies authenticate + the
 * role gate from the 02 §5 matrix.
 */
const router = Router();

// 6 | GET /profile — own profile
router.get('/profile', authenticate, profileController.get);

// 7 | PATCH /profile — update own profile
router.patch('/profile', authenticate, validate(updateProfile), profileController.update);

// 8 | PATCH /profile/password — change own password
router.patch(
  '/profile/password',
  authenticate,
  validate(changePassword),
  profileController.changePassword,
);

// 9 | GET /profile/provider — own provider profile (ADMIN may target via ?user_id=)
router.get(
  '/profile/provider',
  authenticate,
  authorize(RoleName.PROVIDER, RoleName.ADMIN),
  validate(getProviderProfile),
  profileController.getProviderProfile,
);

// 10 | PUT /profile/provider — create/replace own provider profile (upsert)
router.put(
  '/profile/provider',
  authenticate,
  authorize(RoleName.PROVIDER, RoleName.ADMIN),
  validate(upsertProviderProfile),
  profileController.upsertProviderProfile,
);

export default router;
