import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import * as availabilityService from '../services/provider-availability.service';
import { DayOfWeek } from '../types/enums';

interface ListQuery {
  page: number;
  page_size: number;
  sort_by: 'day_of_week' | 'start_time' | 'created_at';
  sort_order: 'asc' | 'desc';
  provider_id?: number;
  day_of_week?: DayOfWeek;
  is_available?: boolean;
}

interface PublicListQuery {
  page: number;
  page_size: number;
  day_of_week?: DayOfWeek;
  is_available?: boolean;
}

/** GET /provider-availability (route 39) — list own (PROVIDER) / any (ADMIN). */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { rows, meta } = await availabilityService.list(
    req.query as unknown as ListQuery,
    req.user!,
  );
  res.json({ success: true, data: rows, meta });
});

/** POST /provider-availability (route 40) — create a window. */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const availability = await availabilityService.create(req.body, req.user!);
  res
    .status(201)
    .location(`/api/v1/provider-availability/${availability.id}`)
    .json({ success: true, data: availability });
});

/** PATCH /provider-availability/:id (route 41) — update a window. */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const availability = await availabilityService.update(
    Number(req.params.id),
    req.body,
    req.user!,
  );
  res.json({ success: true, data: availability });
});

/** DELETE /provider-availability/:id (route 42) — hard delete → 204. */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await availabilityService.remove(Number(req.params.id), req.user!);
  res.status(204).send();
});

/** GET /providers/:providerId/availability (route 43) — public read. */
export const listPublic = asyncHandler(async (req: Request, res: Response) => {
  const { rows, meta } = await availabilityService.listForProvider(
    Number(req.params.providerId),
    req.query as unknown as PublicListQuery,
  );
  res.json({ success: true, data: rows, meta });
});

/** Grouped export so routes can bind `availabilityController.<method>` (03 §13). */
export const availabilityController = {
  list,
  create,
  update,
  delete: remove,
  listPublic,
};
