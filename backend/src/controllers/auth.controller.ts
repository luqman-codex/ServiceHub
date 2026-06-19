import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { NotImplementedError } from '../utils/errors';
import * as authService from '../services/auth.service';

/**
 * Auth controllers (thin): read req.user / validated req.body, call ONE service
 * method, send the canonical success envelope. No business rules here (03 §4).
 */

// POST /auth/register — 201 with AuthResultDTO
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res
    .status(201)
    .location(`/api/v1/users/${result.user.id}`)
    .json({ success: true, data: result });
});

// POST /auth/login — 200 with AuthResultDTO
export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.status(200).json({ success: true, data: result });
});

// POST /auth/logout — stateless 200 acknowledgement (02 §2.3)
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { message: 'Logged out' } });
});

// POST /auth/refresh — reserved; 501 NOT_IMPLEMENTED in the MVP (02 §2.3)
export const refresh = asyncHandler(async (_req: Request, _res: Response) => {
  throw new NotImplementedError('Token refresh is not implemented');
});

// GET /auth/me — current authenticated principal resolved to a fresh UserDTO
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getById(req.user!);
  res.status(200).json({ success: true, data: user });
});
