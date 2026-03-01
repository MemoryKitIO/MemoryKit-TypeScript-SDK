import { describe, it, expect } from 'vitest';
import { toSnakeCase, toCamelCase } from '../src/client.js';

describe('toSnakeCase', () => {
  it('converts simple camelCase keys', () => {
    const result = toSnakeCase({ maxSources: 5, userId: 'u1' });
    expect(result).toEqual({ max_sources: 5, user_id: 'u1' });
  });

  it('handles nested objects', () => {
    const result = toSnakeCase({
      queryParams: {
        maxSources: 5,
        includeGraph: true,
      },
    });
    expect(result).toEqual({
      query_params: {
        max_sources: 5,
        include_graph: true,
      },
    });
  });

  it('handles arrays', () => {
    const result = toSnakeCase([{ userId: 'u1' }, { userId: 'u2' }]);
    expect(result).toEqual([{ user_id: 'u1' }, { user_id: 'u2' }]);
  });

  it('returns primitives unchanged', () => {
    expect(toSnakeCase(42)).toBe(42);
    expect(toSnakeCase('hello')).toBe('hello');
    expect(toSnakeCase(true)).toBe(true);
    expect(toSnakeCase(null)).toBe(null);
    expect(toSnakeCase(undefined)).toBe(undefined);
  });

  it('converts Date to ISO string', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    expect(toSnakeCase(date)).toBe(date.toISOString());
  });

  it('passes FormData through unchanged', () => {
    const fd = new FormData();
    expect(toSnakeCase(fd)).toBe(fd);
  });
});

describe('toCamelCase', () => {
  it('converts simple snake_case keys', () => {
    const result = toCamelCase({ max_sources: 5, user_id: 'u1' });
    expect(result).toEqual({ maxSources: 5, userId: 'u1' });
  });

  it('handles nested objects', () => {
    const result = toCamelCase({
      query_params: {
        max_sources: 5,
        include_graph: true,
      },
    });
    expect(result).toEqual({
      queryParams: {
        maxSources: 5,
        includeGraph: true,
      },
    });
  });

  it('handles arrays of objects', () => {
    const result = toCamelCase([{ user_id: 'u1' }, { user_id: 'u2' }]);
    expect(result).toEqual([{ userId: 'u1' }, { userId: 'u2' }]);
  });

  it('returns primitives unchanged', () => {
    expect(toCamelCase(42)).toBe(42);
    expect(toCamelCase('hello')).toBe('hello');
    expect(toCamelCase(null)).toBe(null);
    expect(toCamelCase(undefined)).toBe(undefined);
  });

  it('handles keys that are already camelCase', () => {
    const result = toCamelCase({ query: 'test', limit: 10 });
    expect(result).toEqual({ query: 'test', limit: 10 });
  });
});
