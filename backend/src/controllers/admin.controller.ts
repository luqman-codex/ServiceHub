import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import * as adminService from '../services/admin.service';
import { BookingStatus } from '../types/enums';
import { GroupBy } from '../validators/admin.validator';

/**
 * Admin Dashboard & Stats controllers (03 §13 rows 44–45).
 * Thin: read validated request data, call exactly one service method, and
 * emit the standard success envelope. No business rules live here.
 */

// GET /admin/stats — dashboard summary counts.
export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getStats();
  res.json({ success: true, data });
});

// GET /admin/stats/bookings — time-bucketed booking counts.
export const bookingStats = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as {
    from?: string;
    to?: string;
    group_by: GroupBy;
    status?: BookingStatus;
  };
  const data = await adminService.getBookingStats(query);
  res.json({ success: true, data });
});
