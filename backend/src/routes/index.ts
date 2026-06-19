import { Router } from 'express';
import authRouter from './auth.routes';
import profileRouter from './profile.routes';
import userRouter from './user.routes';
import categoryRouter from './category.routes';
import serviceRouter from './service.routes';
import bookingRouter from './booking.routes';
import providerAvailabilityRouter from './provider-availability.routes';
import adminRouter from './admin.routes';
import paymentRouter from './payment.routes';
import notificationRouter from './notification.routes';

/**
 * Combined API router (02 §11). Every resource *.routes.ts file defines FULL
 * sub-paths beginning right after `/api/v1`, so each router is mounted at the
 * `/api/v1` root via `router.use(<router>)`. app.ts mounts THIS router at
 * `/api/v1`.
 */
const router = Router();

// GET /api/v1 — meta handler for the versioned API root (02 §11).
router.get('/', (_req, res) => {
  res.json({ name: 'ServiceHub API', version: '1.0.0', status: 'ok' });
});

// Mount all 10 resource routers (each carries its own full sub-paths).
router.use(authRouter); // rows 1–5
router.use(profileRouter); // rows 6–10
router.use(userRouter); // rows 11–16
router.use(categoryRouter); // rows 17–21
router.use(serviceRouter); // rows 22–27
router.use(bookingRouter); // rows 28–38
router.use(providerAvailabilityRouter); // rows 39–43
router.use(adminRouter); // rows 44–45
router.use(paymentRouter); // rows 46–49
router.use(notificationRouter); // rows 50–53

export default router;
export { router as apiRouter };
