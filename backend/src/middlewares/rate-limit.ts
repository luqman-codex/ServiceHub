import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/** Rate limiter for /auth/login + /auth/register → 429 RATE_LIMITED (02 §10). */
export const rateLimitAuth = rateLimit({
  windowMs: config.AUTH_RATE_LIMIT_WINDOW_MS,
  max: config.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
    }),
});
