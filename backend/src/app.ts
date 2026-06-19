import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/env';
import { requestLogger } from './middlewares/request-logger';
import { notFound } from './middlewares/not-found';
import { errorHandler } from './middlewares/error-handler';
import { apiRouter } from './routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGINS, credentials: false }));
  app.use(express.json({ limit: '1mb' })); // body parser
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger); // morgan + request-id

  // health (NOT under /api/v1) — 02 §1.2
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/v1', apiRouter); // every versioned route (02 §11)

  app.use(notFound); // unknown route → 404 NOT_FOUND
  app.use(errorHandler); // MUST be last (4-arg signature)
  return app;
}
