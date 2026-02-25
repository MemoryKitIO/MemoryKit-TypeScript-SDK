import type { HttpClient } from '../client.js';
import type {
  Webhook,
  CreateWebhookParams,
  WebhookTestResult,
} from '../types.js';

/**
 * Resource class for the `/v1/webhooks` endpoints.
 *
 * @example
 * ```ts
 * const wh = await mk.webhooks.create({ url: "https://...", events: ["memory.completed"] });
 * console.log(wh.secret); // signing secret for verification
 * ```
 */
export class WebhooksResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Register a new webhook endpoint.
   * The response includes a `secret` for signature verification.
   */
  async create(params: CreateWebhookParams): Promise<Webhook> {
    return this.client.request<Webhook>({
      method: 'POST',
      path: '/v1/webhooks',
      body: params,
    });
  }

  /**
   * List all registered webhooks.
   */
  async list(): Promise<Webhook[]> {
    return this.client.request<Webhook[]>({
      method: 'GET',
      path: '/v1/webhooks',
    });
  }

  /**
   * Get a webhook by ID.
   */
  async get(id: string): Promise<Webhook> {
    return this.client.request<Webhook>({
      method: 'GET',
      path: `/v1/webhooks/${encodeURIComponent(id)}`,
    });
  }

  /**
   * Delete a webhook.
   */
  async delete(id: string): Promise<void> {
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/webhooks/${encodeURIComponent(id)}`,
    });
  }

  /**
   * Send a test event to a webhook endpoint to verify connectivity.
   */
  async test(id: string): Promise<WebhookTestResult> {
    return this.client.request<WebhookTestResult>({
      method: 'POST',
      path: `/v1/webhooks/${encodeURIComponent(id)}/test`,
    });
  }
}
