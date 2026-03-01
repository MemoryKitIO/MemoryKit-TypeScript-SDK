// ---------------------------------------------------------------------------
// camelCase <-> snake_case conversion utilities
// ---------------------------------------------------------------------------

/**
 * Convert a camelCase string to snake_case.
 * Example: "maxSources" -> "max_sources"
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert a snake_case string to camelCase.
 * Example: "max_sources" -> "maxSources"
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Recursively convert all object keys from camelCase to snake_case.
 * Used on request bodies before sending to the API.
 *
 * The `metadata` field value is preserved as-is to avoid corrupting user-defined keys.
 */
export function toSnakeCase(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(toSnakeCase);
  if (data instanceof Date) return data.toISOString();
  if (data instanceof FormData) return data;
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const convertedKey = camelToSnake(key);
      if (key === 'metadata') {
        result[convertedKey] = value; // preserve as-is
      } else {
        result[convertedKey] = toSnakeCase(value);
      }
    }
    return result;
  }
  return data;
}

/**
 * Recursively convert all object keys from snake_case to camelCase.
 * Used on response bodies before returning to the caller.
 *
 * The `metadata` field value is preserved as-is to avoid corrupting user-defined keys.
 */
export function toCamelCase(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(toCamelCase);
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const convertedKey = snakeToCamel(key);
      if (key === 'metadata') {
        result[convertedKey] = value; // preserve as-is
      } else {
        result[convertedKey] = toCamelCase(value);
      }
    }
    return result;
  }
  return data;
}

/**
 * Convert a single camelCase key to snake_case.
 * Exported for use in query parameter building.
 */
export { camelToSnake, snakeToCamel };
