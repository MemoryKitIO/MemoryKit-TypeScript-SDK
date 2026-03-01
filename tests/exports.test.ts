import { describe, it, expect } from 'vitest';

/**
 * Verify that all expected public exports are available from the package entry point.
 * This catches accidental removal of exports during refactoring.
 */
describe('Public exports', () => {
  it('exports MemoryKit class', async () => {
    const mod = await import('../src/index.js');
    expect(mod.MemoryKit).toBeDefined();
    expect(typeof mod.MemoryKit).toBe('function');
  });

  it('exports MemoryKit as default', async () => {
    const mod = await import('../src/index.js');
    expect(mod.default).toBe(mod.MemoryKit);
  });

  it('exports all error classes', async () => {
    const mod = await import('../src/index.js');
    expect(mod.MemoryKitError).toBeDefined();
    expect(mod.AuthenticationError).toBeDefined();
    expect(mod.RateLimitError).toBeDefined();
    expect(mod.NotFoundError).toBeDefined();
    expect(mod.ValidationError).toBeDefined();
    expect(mod.ServerError).toBeDefined();
  });

  it('exports all resource classes', async () => {
    const mod = await import('../src/index.js');
    expect(mod.MemoriesResource).toBeDefined();
    expect(mod.ChatsResource).toBeDefined();
    expect(mod.UsersResource).toBeDefined();
    expect(mod.WebhooksResource).toBeDefined();
    expect(mod.StatusResource).toBeDefined();
    expect(mod.FeedbackResource).toBeDefined();
  });
});
