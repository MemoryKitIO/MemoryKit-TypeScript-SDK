import type { HttpClient } from '../client.js';
import type { Feedback, CreateFeedbackParams } from '../types.js';

/**
 * Resource class for the `/v1/feedback` endpoint.
 *
 * @example
 * ```ts
 * await mk.feedback.create({
 *   requestId: "req_abc123",
 *   rating: 5,
 *   comment: "Very accurate answer",
 * });
 * ```
 */
export class FeedbackResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Submit feedback for a previous query or chat response.
   */
  async create(params: CreateFeedbackParams): Promise<Feedback> {
    return this.client.request<Feedback>({
      method: 'POST',
      path: '/v1/feedback',
      body: params,
    });
  }
}
