import type { HttpClient } from '../client.js';
import type { ProjectStatus } from '../types.js';

/**
 * Resource class for the `/v1/status` endpoint.
 *
 * @example
 * ```ts
 * const status = await mk.status.get();
 * console.log(status.usage.memories);
 * ```
 */
export class StatusResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Get project usage and billing information.
   */
  async get(): Promise<ProjectStatus> {
    return this.client.request<ProjectStatus>({
      method: 'GET',
      path: '/v1/status',
    });
  }
}
