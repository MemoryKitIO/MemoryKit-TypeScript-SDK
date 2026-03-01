import { describe, it, expect } from 'vitest';
import { MemoryKit } from '../src/index.js';
import { MemoryKitError } from '../src/errors.js';

describe('MemoryKit client initialization', () => {
  it('creates client with valid API key', () => {
    const mk = new MemoryKit({ apiKey: 'ctx_test_key' });
    expect(mk).toBeInstanceOf(MemoryKit);
  });

  it('throws MemoryKitError when apiKey is empty', () => {
    expect(() => new MemoryKit({ apiKey: '' })).toThrow(MemoryKitError);
    expect(() => new MemoryKit({ apiKey: '' })).toThrow('API key is required');
  });

  it('exposes all resource properties', () => {
    const mk = new MemoryKit({ apiKey: 'ctx_test_key' });
    expect(mk.memories).toBeDefined();
    expect(mk.chats).toBeDefined();
    expect(mk.users).toBeDefined();
    expect(mk.webhooks).toBeDefined();
    expect(mk.status).toBeDefined();
    expect(mk.feedback).toBeDefined();
  });

  it('accepts custom base URL', () => {
    const mk = new MemoryKit({
      apiKey: 'ctx_test_key',
      baseUrl: 'https://custom.api.io/v1',
    });
    expect(mk).toBeInstanceOf(MemoryKit);
  });

  it('accepts custom timeout and maxRetries', () => {
    const mk = new MemoryKit({
      apiKey: 'ctx_test_key',
      timeout: 60000,
      maxRetries: 5,
    });
    expect(mk).toBeInstanceOf(MemoryKit);
  });
});
