import { ErrorRequestHandler } from 'express';
import {
  UniqueConstraintError,
  ForeignKeyConstraintError,
  ValidationError as SequelizeValidationError,
} from 'sequelize';
import { AppError } from '../utils/errors';
import { config } from '../config/env';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // 1) our own typed errors → exact status + code + envelope (02 §3.2)
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // 2) Sequelize uniqueness → 409 DUPLICATE_RESOURCE (map email separately in services)
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_RESOURCE', message: 'Resource already exists' },
    });
  }
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'Referenced resource constraint failed' },
    });
  }
  if (err instanceof SequelizeValidationError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors.map((e) => ({ field: e.path ?? 'unknown', message: e.message })),
      },
    });
  }

  // 3) bad JSON body parsed by express.json
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Malformed JSON body' },
    });
  }

  // 4) anything else → 500 INTERNAL_ERROR, never leak the stack (02 §4)
  if (config.NODE_ENV !== 'test') console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
};
