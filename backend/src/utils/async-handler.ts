import { RequestHandler } from 'express';

/** Wraps an async controller so rejected promises reach the error middleware. */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
