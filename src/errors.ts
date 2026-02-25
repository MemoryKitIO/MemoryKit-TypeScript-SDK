/**
 * Base error class for all MemoryKit SDK errors.
 */
export class MemoryKitError extends Error {
  /** HTTP status code, if applicable. */
  readonly statusCode: number | undefined;

  /** Machine-readable error code returned by the API. */
  readonly code: string | undefined;

  /** The original request ID for debugging. */
  readonly requestId: string | undefined;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      code?: string;
      requestId?: string;
    },
  ) {
    super(message);
    this.name = 'MemoryKitError';
    this.statusCode = options?.statusCode;
    this.code = options?.code;
    this.requestId = options?.requestId;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the API key is missing or invalid (HTTP 401).
 */
export class AuthenticationError extends MemoryKitError {
  constructor(
    message = 'Invalid or missing API key.',
    options?: { code?: string; requestId?: string },
  ) {
    super(message, { statusCode: 401, ...options });
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when the request is rate-limited (HTTP 429).
 * Includes a `retryAfter` hint in seconds when the API provides one.
 */
export class RateLimitError extends MemoryKitError {
  /** Seconds to wait before retrying, from the `Retry-After` header. */
  readonly retryAfter: number | undefined;

  constructor(
    message = 'Rate limit exceeded. Please retry later.',
    options?: { retryAfter?: number; code?: string; requestId?: string },
  ) {
    super(message, { statusCode: 429, ...options });
    this.name = 'RateLimitError';
    this.retryAfter = options?.retryAfter;
  }
}

/**
 * Thrown when the requested resource is not found (HTTP 404).
 */
export class NotFoundError extends MemoryKitError {
  constructor(
    message = 'The requested resource was not found.',
    options?: { code?: string; requestId?: string },
  ) {
    super(message, { statusCode: 404, ...options });
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when the request body fails validation (HTTP 400 / 422).
 */
export class ValidationError extends MemoryKitError {
  /** Per-field validation errors returned by the API. */
  readonly errors: Record<string, string[]> | undefined;

  constructor(
    message = 'The request failed validation.',
    options?: {
      statusCode?: number;
      code?: string;
      requestId?: string;
      errors?: Record<string, string[]>;
    },
  ) {
    super(message, {
      statusCode: options?.statusCode ?? 400,
      code: options?.code,
      requestId: options?.requestId,
    });
    this.name = 'ValidationError';
    this.errors = options?.errors;
  }
}

/**
 * Thrown when the server returns an unexpected error (HTTP 5xx).
 */
export class ServerError extends MemoryKitError {
  constructor(
    message = 'An internal server error occurred.',
    options?: { statusCode?: number; code?: string; requestId?: string },
  ) {
    super(message, { statusCode: options?.statusCode ?? 500, ...options });
    this.name = 'ServerError';
  }
}
