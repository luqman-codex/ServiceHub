import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { serializePayment } from '../utils/serializers';
import * as paymentService from '../services/payment.service';
import { CreatePaymentBody, ListPaymentsQuery } from '../validators/payment.validator';

/**
 * Payment controllers (03 §13 rows 46–49). Thin: read req.user / req.params /
 * validated body+query, call ONE service method, serialize to a DTO, and send the
 * standard success envelope. No business rules and no direct Sequelize access.
 */

// POST /bookings/:id/payment
export const create = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.createForBooking(
    Number(req.params.id),
    req.body as CreatePaymentBody,
    req.user!,
  );
  res
    .status(201)
    .location(`/api/v1/payments/${payment.id}`)
    .json({ success: true, data: serializePayment(payment) });
});

// GET /bookings/:id/payment
export const getForBooking = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.getForBooking(Number(req.params.id), req.user!);
  res.json({ success: true, data: serializePayment(payment) });
});

// GET /payments
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { rows, meta } = await paymentService.list(req.query as unknown as ListPaymentsQuery);
  res.json({ success: true, data: rows.map(serializePayment), meta });
});

// GET /payments/:id
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.getById(Number(req.params.id));
  res.json({ success: true, data: serializePayment(payment) });
});
