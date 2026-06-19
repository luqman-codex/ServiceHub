import { RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/errors';

type Schemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    const details: { field: string; message: string }[] = [];
    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        for (const issue of result.error.issues)
          details.push({ field: issue.path.join('.') || key, message: issue.message });
      } else {
        // overwrite with parsed+coerced values (numbers, defaults, trims) so controllers get clean data
        (req as unknown as Record<string, unknown>)[key] = result.data;
      }
    }
    if (details.length) return next(new ValidationError(details));
    next();
  };
