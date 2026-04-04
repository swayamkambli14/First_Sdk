/**
 * Base error class for all application errors.
 * Carries a machine-readable errorCode for programmatic handling
 * and a human-readable message for logging/display.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  readonly errorCode: string;

  constructor(message: string, errorCode: string) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  constructor(message: string, errorCode = 'VALIDATION_ERROR') {
    super(message, errorCode);
  }
}

export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  constructor(message: string, errorCode = 'AUTHENTICATION_ERROR') {
    super(message, errorCode);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  constructor(message: string, errorCode = 'FORBIDDEN') {
    super(message, errorCode);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  constructor(message: string, errorCode = 'NOT_FOUND') {
    super(message, errorCode);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  constructor(message: string, errorCode = 'CONFLICT') {
    super(message, errorCode);
  }
}

export class RateLimitError extends AppError {
  readonly statusCode = 429;
  constructor(message: string, errorCode = 'RATE_LIMIT_EXCEEDED') {
    super(message, errorCode);
  }
}

export class InternalError extends AppError {
  readonly statusCode = 500;
  constructor(message: string, errorCode = 'INTERNAL_ERROR') {
    super(message, errorCode);
  }
}
