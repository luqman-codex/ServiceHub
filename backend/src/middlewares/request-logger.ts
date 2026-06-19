import morgan from 'morgan';
import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';
import { config } from '../config/env';

export const attachRequestId: RequestHandler = (req, res, next) => {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('x-request-id', id);
  (req as unknown as Record<string, unknown>).requestId = id;
  next();
};

morgan.token('id', (req) => (req as unknown as Record<string, unknown>).requestId as string);

// dev: colorized concise; prod: combined + request id; silenced in tests.
const format =
  config.NODE_ENV === 'development' ? 'dev' : ':id :method :url :status :response-time ms';

const handlers: RequestHandler[] = [attachRequestId];
if (config.NODE_ENV !== 'test') {
  handlers.push(morgan(format));
}

export const requestLogger: RequestHandler[] = handlers;
