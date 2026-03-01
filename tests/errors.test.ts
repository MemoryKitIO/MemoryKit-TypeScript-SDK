import { describe, it, expect } from 'vitest';
import {
  MemoryKitError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  ServerError,
} from '../src/errors.js';

describe('MemoryKitError', () => {
  it('creates with message only', () => {
    const err = new MemoryKitError('something went wrong');
    expect(err.message).toBe('something went wrong');
    expect(err.name).toBe('MemoryKitError');
    expect(err.statusCode).toBeUndefined();
    expect(err.code).toBeUndefined();
    expect(err.requestId).toBeUndefined();
  });

  it('creates with all options', () => {
    const err = new MemoryKitError('fail', {
      statusCode: 500,
      code: 'internal_error',
      requestId: 'req_123',
    });
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('internal_error');
    expect(err.requestId).toBe('req_123');
  });

  it('is instanceof Error', () => {
    const err = new MemoryKitError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(MemoryKitError);
  });
});

describe('AuthenticationError', () => {
  it('has correct defaults', () => {
    const err = new AuthenticationError();
    expect(err.name).toBe('AuthenticationError');
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Invalid or missing API key.');
  });

  it('accepts custom message and options', () => {
    const err = new AuthenticationError('Custom auth error', {
      code: 'invalid_token',
      requestId: 'req_456',
    });
    expect(err.message).toBe('Custom auth error');
    expect(err.code).toBe('invalid_token');
    expect(err.requestId).toBe('req_456');
  });

  it('is instanceof MemoryKitError', () => {
    const err = new AuthenticationError();
    expect(err).toBeInstanceOf(MemoryKitError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('RateLimitError', () => {
  it('has correct defaults', () => {
    const err = new RateLimitError();
    expect(err.name).toBe('RateLimitError');
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBeUndefined();
  });

  it('stores retryAfter value', () => {
    const err = new RateLimitError('Rate limited', { retryAfter: 30 });
    expect(err.retryAfter).toBe(30);
  });

  it('is instanceof MemoryKitError', () => {
    const err = new RateLimitError();
    expect(err).toBeInstanceOf(MemoryKitError);
  });
});

describe('NotFoundError', () => {
  it('has correct defaults', () => {
    const err = new NotFoundError();
    expect(err.name).toBe('NotFoundError');
    expect(err.statusCode).toBe(404);
  });

  it('is instanceof MemoryKitError', () => {
    expect(new NotFoundError()).toBeInstanceOf(MemoryKitError);
  });
});

describe('ValidationError', () => {
  it('has correct defaults', () => {
    const err = new ValidationError();
    expect(err.name).toBe('ValidationError');
    expect(err.statusCode).toBe(400);
    expect(err.errors).toBeUndefined();
  });

  it('stores field-level errors', () => {
    const err = new ValidationError('Validation failed', {
      errors: { content: ['is required'], title: ['too long'] },
    });
    expect(err.errors).toEqual({
      content: ['is required'],
      title: ['too long'],
    });
  });

  it('supports 422 status code', () => {
    const err = new ValidationError('Unprocessable', { statusCode: 422 });
    expect(err.statusCode).toBe(422);
  });

  it('is instanceof MemoryKitError', () => {
    expect(new ValidationError()).toBeInstanceOf(MemoryKitError);
  });
});

describe('ServerError', () => {
  it('has correct defaults', () => {
    const err = new ServerError();
    expect(err.name).toBe('ServerError');
    expect(err.statusCode).toBe(500);
  });

  it('supports custom 5xx status code', () => {
    const err = new ServerError('Bad Gateway', { statusCode: 502 });
    expect(err.statusCode).toBe(502);
  });

  it('is instanceof MemoryKitError', () => {
    expect(new ServerError()).toBeInstanceOf(MemoryKitError);
  });
});

describe('Error hierarchy', () => {
  it('all subclasses are catchable as MemoryKitError', () => {
    const errors = [
      new AuthenticationError(),
      new RateLimitError(),
      new NotFoundError(),
      new ValidationError(),
      new ServerError(),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(MemoryKitError);
      expect(err).toBeInstanceOf(Error);
    }
  });
});
