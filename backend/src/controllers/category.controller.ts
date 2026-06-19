import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import * as categoryService from '../services/category.service';

/**
 * Category controller (03 §13 rows 17–21). Thin: reads validated input + req.user,
 * calls exactly one service method, sends the standard success envelope. No business rules.
 */

// GET /categories — public list
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await categoryService.list(
    req.query as unknown as Parameters<typeof categoryService.list>[0],
    req.user,
  );
  res.json({ success: true, data, meta });
});

// GET /categories/:id — public read
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getById(Number(req.params.id));
  res.json({ success: true, data: category });
});

// POST /categories — ADMIN create
export const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.create(req.body);
  res
    .status(201)
    .location(`/api/v1/categories/${category.id}`)
    .json({ success: true, data: category });
});

// PATCH /categories/:id — ADMIN update
export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.update(Number(req.params.id), req.body);
  res.json({ success: true, data: category });
});

// DELETE /categories/:id — ADMIN soft delete
export const softDelete = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryService.softDelete(Number(req.params.id));
  res.json({ success: true, data: result });
});
