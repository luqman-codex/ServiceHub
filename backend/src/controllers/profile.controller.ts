import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { serializeUser, serializeProviderProfile } from '../utils/serializers';
import * as profileService from '../services/profile.service';

/** GET /profile — own profile (02 §8.2). */
export const get = asyncHandler(async (req: Request, res: Response) => {
  const user = await profileService.getOwn(req.user!);
  res.json({ success: true, data: serializeUser(user) });
});

/** PATCH /profile — update own profile (02 §8.2). */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = await profileService.updateOwn(req.body, req.user!);
  res.json({ success: true, data: serializeUser(user) });
});

/** PATCH /profile/password — change own password (02 §8.2). */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await profileService.changePassword(req.body, req.user!);
  res.json({ success: true, data: result });
});

/** GET /profile/provider — read own provider profile (02 §8.2). */
export const getProviderProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await profileService.getProviderProfile(
    req.query as { user_id?: number },
    req.user!,
  );
  res.json({ success: true, data: serializeProviderProfile(profile) });
});

/** PUT /profile/provider — create/replace own provider profile (02 §8.2). */
export const upsertProviderProfile = asyncHandler(async (req: Request, res: Response) => {
  const { profile, created } = await profileService.upsertProviderProfile(req.body, req.user!);
  res.status(created ? 201 : 200).json({ success: true, data: serializeProviderProfile(profile) });
});
