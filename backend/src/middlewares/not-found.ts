import { RequestHandler } from 'express';
import { NotFoundError } from '../utils/errors';

export const notFound: RequestHandler = (_req, _res, next) => next(new NotFoundError('Route not found'));
