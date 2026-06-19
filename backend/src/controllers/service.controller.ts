import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { serializeService } from '../utils/serializers';
import * as serviceService from '../services/service.service';

/**
 * Service-resource controllers (03 §13 rows 22–27).
 *
 * Thin: read req.user / req.params / validated req.body|req.query, call exactly
 * one service method, serialize via `serializeService`, and send the canonical
 * success envelope (02 §3.1). No business rules, no Sequelize access.
 */

// GET /services
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { rows, meta } = await serviceService.list(
    req.query as unknown as Parameters<typeof serviceService.list>[0],
    req.user,
  );
  res.json({ success: true, data: rows.map(serializeService), meta });
});

// GET /services/:id
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const service = await serviceService.getById(
    Number(req.params.id),
    req.query.include as string | undefined,
  );
  res.json({ success: true, data: serializeService(service) });
});

// POST /services
export const create = asyncHandler(async (req: Request, res: Response) => {
  const service = await serviceService.create(
    req.body as Parameters<typeof serviceService.create>[0],
  );
  res
    .status(201)
    .location(`/api/v1/services/${service.id}`)
    .json({ success: true, data: serializeService(service) });
});

// PATCH /services/:id
export const update = asyncHandler(async (req: Request, res: Response) => {
  const service = await serviceService.update(
    Number(req.params.id),
    req.body as Parameters<typeof serviceService.update>[1],
  );
  res.json({ success: true, data: serializeService(service) });
});

// PATCH /services/:id/price
export const updatePrice = asyncHandler(async (req: Request, res: Response) => {
  const service = await serviceService.updatePrice(
    Number(req.params.id),
    req.body as Parameters<typeof serviceService.updatePrice>[1],
  );
  res.json({ success: true, data: serializeService(service) });
});

// DELETE /services/:id (soft delete)
export const softDelete = asyncHandler(async (req: Request, res: Response) => {
  const result = await serviceService.softDelete(Number(req.params.id));
  res.json({ success: true, data: result });
});
