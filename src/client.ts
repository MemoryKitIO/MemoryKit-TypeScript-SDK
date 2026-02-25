import {
  MemoryKitError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  ServerError,
} from './errors.js';
import { parseSSEStream } from './sse.js';
import type { MemoryKitOptions, StreamEvent } from './types.js';

const SDK_VERSION = '0.1.0';
const DEFAULT_BASE_URL = 'https://api.memorykit.io/v1';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

/** Initial backoff delay in ms for exponential retry. */
const INITIAL_BACKOFF_MS = 500;

/** Set of HTTP status codes eligible for automatic retry. */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  /** If `true`, return the raw `Response` object (used for streaming). */
  raw?: boolean;
  /** Override timeout for this request (e.g. streaming). */
  timeout?: number;
}

/**
 * Low-level HTTP client that wraps `fetch` with auth, retries, timeouts,
 * and typed error handling. All resource classes delegate to this client.
 */
export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(options: MemoryKitOptions) {
    if (!options.apiKey) {
      throw new MemoryKitError(
        'An API key is required. Pass it as `apiKey` or set the MEMORYKIT_API_KEY environment variable.',
      );
    }

    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  // -----------------------------------------------------------------------
  // Public helpers
  // -----------------------------------------------------------------------

  /** Perform a JSON request and return the parsed body. */
  async request<T>(opts: RequestOptions): Promise<T> {
    const res = await this.fetchWithRetry(opts);

    // 204 No Content
    if (res.status === 204) {
      return undefined as T;
    }

    const json = await res.json();
    return json as T;
  }

  /** Perform a request and return an SSE `AsyncIterable`. */
  async stream(opts: Omit<RequestOptions, 'raw'>): Promise<AsyncIterable<StreamEvent>> {
    const res = await this.fetchWithRetry({
      ...opts,
      raw: true,
      headers: {
        ...opts.headers,
        Accept: 'text/event-stream',
      },
      // Streaming requests get a longer timeout
      timeout: opts.timeout ?? 120_000,
    });

    if (!res.body) {
      throw new MemoryKitError('Response body is null — streaming not supported in this environment.');
    }

    return parseSSEStream(res.body);
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private async fetchWithRetry(opts: RequestOptions): Promise<Response> {
    const url = this.buildUrl(opts.path, opts.query);
    const isFormData = opts.body instanceof FormData;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': `memorykit-js/${SDK_VERSION}`,
      ...opts.headers,
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = headers['Accept'] ?? 'application/json';
    }

    const requestTimeout = opts.timeout ?? this.timeout;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), requestTimeout);

      try {
        const res = await fetch(url, {
          method: opts.method,
          headers,
          body: isFormData
            ? (opts.body as FormData)
            : opts.body != null
              ? JSON.stringify(opts.body)
              : undefined,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (res.ok || res.status === 202) {
          return res;
        }

        // Build a typed error
        const err = await this.buildError(res);

        // Retry on retryable status codes
        if (RETRYABLE_STATUS_CODES.has(res.status) && attempt < this.maxRetries) {
          lastError = err;
          const backoff = this.getBackoff(attempt, res);
          await sleep(backoff);
          continue;
        }

        throw err;
      } catch (error) {
        clearTimeout(timer);

        if (error instanceof MemoryKitError) {
          throw error;
        }

        // AbortError = timeout
        if (error instanceof DOMException && error.name === 'AbortError') {
          lastError = new MemoryKitError(
            `Request timed out after ${requestTimeout}ms`,
            { statusCode: undefined },
          );
        } else if (error instanceof TypeError) {
          // Network error
          lastError = new MemoryKitError(
            `Network error: ${(error as Error).message}`,
            { statusCode: undefined },
          );
        } else {
          lastError = error as Error;
        }

        if (attempt < this.maxRetries) {
          await sleep(this.getBackoff(attempt));
          continue;
        }

        throw lastError instanceof MemoryKitError
          ? lastError
          : new MemoryKitError((lastError as Error).message);
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError ?? new MemoryKitError('Unexpected error during request.');
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(path, this.baseUrl + '/');
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async buildError(res: Response): Promise<MemoryKitError> {
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      // non-JSON error body — that's fine
    }

    const message = (body.message as string) ?? (body.error as string) ?? res.statusText;
    const code = body.code as string | undefined;
    const requestId = (res.headers.get('x-request-id') ?? body.requestId) as string | undefined;

    switch (res.status) {
      case 401:
        return new AuthenticationError(message, { code, requestId });
      case 429: {
        const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
        return new RateLimitError(message, { retryAfter, code, requestId });
      }
      case 404:
        return new NotFoundError(message, { code, requestId });
      case 400:
      case 422:
        return new ValidationError(message, {
          statusCode: res.status,
          code,
          requestId,
          errors: body.errors as Record<string, string[]> | undefined,
        });
      default:
        if (res.status >= 500) {
          return new ServerError(message, { statusCode: res.status, code, requestId });
        }
        return new MemoryKitError(message, { statusCode: res.status, code, requestId });
    }
  }

  /**
   * Exponential backoff with jitter.
   * For 429 responses, prefer the `Retry-After` header value.
   */
  private getBackoff(attempt: number, res?: Response): number {
    if (res) {
      const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
      if (retryAfter) return retryAfter * 1000;
    }
    const base = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
    const jitter = Math.random() * INITIAL_BACKOFF_MS;
    return base + jitter;
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds : undefined;
}
