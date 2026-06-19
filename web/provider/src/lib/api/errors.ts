// src/lib/api/errors.ts — normalized API error (04 §5).

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: FieldError[];

  constructor(p: { status: number; code: string; message: string; details?: FieldError[] }) {
    super(p.message);
    this.name = 'ApiError';
    this.status = p.status;
    this.code = p.code;
    this.details = p.details;
  }
}
