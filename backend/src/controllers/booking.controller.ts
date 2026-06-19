import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { serializeBooking } from '../utils/serializers';
import * as bookingService from '../services/booking.service';
import { BookingStatus } from '../types/enums';

// POST /bookings (row 28)
export const create = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.create(req.body, req.user!);
  res
    .status(201)
    .location(`/api/v1/bookings/${booking.id}`)
    .json({ success: true, data: serializeBooking(booking) });
});

// GET /bookings (row 29) — role-scoped list
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { rows, meta } = await bookingService.list(
    req.query as Record<string, unknown>,
    req.user!,
  );
  res.json({ success: true, data: rows.map((b) => serializeBooking(b)), meta });
});

// GET /bookings/:id (row 30)
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.getByIdScoped(
    Number(req.params.id),
    req.user!,
    String((req.query as Record<string, unknown>).include ?? ''),
  );
  res.json({ success: true, data: serializeBooking(booking) });
});

// PATCH /bookings/:id (row 31) — edit mutable details
export const update = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.updateDetails(Number(req.params.id), req.body, req.user!);
  res.json({ success: true, data: serializeBooking(booking) });
});

// Action endpoints (rows 32-36) all delegate to one service method with the target status.
const action = (target: BookingStatus) =>
  asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.transition(
      Number(req.params.id),
      target,
      req.user!,
      (req.body as { cancellation_reason?: string } | undefined)?.cancellation_reason,
    );
    res.json({ success: true, data: serializeBooking(booking) });
  });

export const accept = action(BookingStatus.ACCEPTED);
export const reject = action(BookingStatus.REJECTED);
export const start = action(BookingStatus.IN_PROGRESS);
export const complete = action(BookingStatus.COMPLETED);
export const cancel = action(BookingStatus.CANCELLED);

// PATCH /bookings/:id/status (row 37) — admin generic transition
export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { status: BookingStatus; cancellation_reason?: string };
  const booking = await bookingService.adminSetStatus(
    Number(req.params.id),
    body.status,
    req.user!,
    body.cancellation_reason,
  );
  res.json({ success: true, data: serializeBooking(booking) });
});

// PATCH /bookings/:id/assign (row 38) — admin set/reassign provider
export const assign = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { provider_id: number | null };
  const booking = await bookingService.assignProvider(
    Number(req.params.id),
    body.provider_id,
    req.user!,
  );
  res.json({ success: true, data: serializeBooking(booking) });
});
