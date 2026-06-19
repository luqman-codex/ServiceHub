import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import * as userService from '../services/user.service';
import { CreateUserInput, ListUsersQuery, UpdateUserInput } from '../services/user.service';
import { RoleName } from '../types/enums';

/**
 * Users (admin) controller — thin (03 §4). Each handler reads `req.user` /
 * `req.params` / validated `req.body`/`req.query`, calls exactly ONE service
 * method, and sends the canonical success envelope (02 §3.1). No business rules.
 */

// GET /users (row 11)
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await userService.list(req.query as unknown as ListUsersQuery);
  res.json({ success: true, data, meta });
});

// POST /users (row 12)
export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.create(req.body as CreateUserInput);
  res.status(201).location(`/api/v1/users/${user.id}`).json({ success: true, data: user });
});

// GET /users/:id (row 13)
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getById(Number(req.params.id));
  res.json({ success: true, data: user });
});

// PATCH /users/:id (row 14)
export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.update(Number(req.params.id), req.body as UpdateUserInput);
  res.json({ success: true, data: user });
});

// PATCH /users/:id/status (row 15)
export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { is_active } = req.body as { is_active: boolean };
  const user = await userService.setStatus(Number(req.params.id), is_active, req.user!);
  res.json({ success: true, data: user });
});

// PATCH /users/:id/role (row 16)
export const setRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body as { role: RoleName };
  const user = await userService.setRole(Number(req.params.id), role, req.user!);
  res.json({ success: true, data: user });
});
