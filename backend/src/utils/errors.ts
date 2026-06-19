import { FieldError } from '../types/dto';

export abstract class AppError extends Error {
  abstract readonly status: number; // HTTP status
  abstract readonly code: string; // stable error.code (02 §4.2)
  readonly details?: FieldError[];
  constructor(message: string, details?: FieldError[]) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly status = 422;
  readonly code = 'VALIDATION_ERROR';
  constructor(details: FieldError[], message = 'Request validation failed') {
    super(message, details);
  }
}

export class BadRequestError extends AppError {
  readonly status = 400;
  constructor(
    message = 'Bad request',
    public readonly code = 'BAD_REQUEST',
  ) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  readonly status = 401;
  constructor(
    message = 'Unauthorized',
    public readonly code = 'UNAUTHORIZED',
  ) {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly status = 403;
  constructor(
    message = 'Forbidden',
    public readonly code = 'FORBIDDEN',
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly status = 404;
  readonly code = 'NOT_FOUND';
  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly status = 409;
  constructor(
    message = 'Conflict',
    public readonly code = 'CONFLICT',
  ) {
    super(message);
  }
}

export class InvalidStatusTransitionError extends ConflictError {
  constructor(message: string) {
    super(message, 'INVALID_STATUS_TRANSITION');
  }
}

export class NotImplementedError extends AppError {
  readonly status = 501;
  readonly code = 'NOT_IMPLEMENTED';
  constructor(message = 'Not implemented') {
    super(message);
  }
}
