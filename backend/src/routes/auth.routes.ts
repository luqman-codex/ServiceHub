import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { rateLimitAuth } from '../middlewares/rate-limit';
import { register, login } from '../validators/auth.validator';
import * as authController from '../controllers/auth.controller';

/**
 * Auth routes (02 §8.1, 03 §13 rows 1-5). FULL sub-paths begin right after /api/v1.
 * Mounted at the /api/v1 root via routes/index.ts (router.use(authRouter)).
 */
const router = Router();

// 1 | POST /auth/register | rateLimitAuth, validate(register)
router.post('/auth/register', rateLimitAuth, validate(register), authController.register);

// 2 | POST /auth/login | rateLimitAuth, validate(login)
router.post('/auth/login', rateLimitAuth, validate(login), authController.login);

// 3 | POST /auth/logout | authenticate
router.post('/auth/logout', authenticate, authController.logout);

// 4 | POST /auth/refresh | authenticate (returns 501 NOT_IMPLEMENTED)
router.post('/auth/refresh', authenticate, authController.refresh);

// 5 | GET /auth/me | authenticate
router.get('/auth/me', authenticate, authController.me);

export default router;
