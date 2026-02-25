import type { HttpClient } from '../client.js';
import type {
  User,
  UpsertUserParams,
  UpdateUserParams,
  DeleteUserOptions,
  UserEvent,
  CreateEventParams,
  ListEventsParams,
} from '../types.js';

/**
 * Resource class for the `/v1/users` and `/v1/users/:id/events` endpoints.
 *
 * @example
 * ```ts
 * await mk.users.upsert({ id: "user_123", name: "Alice" });
 * await mk.users.createEvent("user_123", { type: "page_view", data: { page: "/" } });
 * ```
 */
export class UsersResource {
  constructor(private readonly client: HttpClient) {}

  // -----------------------------------------------------------------------
  // Users CRUD
  // -----------------------------------------------------------------------

  /**
   * Create or update a user (idempotent upsert).
   */
  async upsert(params: UpsertUserParams): Promise<User> {
    return this.client.request<User>({
      method: 'POST',
      path: '/v1/users',
      body: params,
    });
  }

  /**
   * Get a user by ID.
   */
  async get(id: string): Promise<User> {
    return this.client.request<User>({
      method: 'GET',
      path: `/v1/users/${encodeURIComponent(id)}`,
    });
  }

  /**
   * Update a user's properties.
   */
  async update(id: string, params: UpdateUserParams): Promise<User> {
    return this.client.request<User>({
      method: 'PUT',
      path: `/v1/users/${encodeURIComponent(id)}`,
      body: params,
    });
  }

  /**
   * Soft-delete a user.
   * @param options.cascade - If `true`, also delete the user's memories and chats.
   */
  async delete(id: string, options?: DeleteUserOptions): Promise<void> {
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/users/${encodeURIComponent(id)}`,
      query: options?.cascade !== undefined ? { cascade: options.cascade } : undefined,
    });
  }

  // -----------------------------------------------------------------------
  // User Events
  // -----------------------------------------------------------------------

  /**
   * Create an event for a user.
   */
  async createEvent(userId: string, params: CreateEventParams): Promise<UserEvent> {
    return this.client.request<UserEvent>({
      method: 'POST',
      path: `/v1/users/${encodeURIComponent(userId)}/events`,
      body: params,
    });
  }

  /**
   * List events for a user.
   */
  async listEvents(userId: string, params?: ListEventsParams): Promise<UserEvent[]> {
    return this.client.request<UserEvent[]>({
      method: 'GET',
      path: `/v1/users/${encodeURIComponent(userId)}/events`,
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Delete a specific event.
   */
  async deleteEvent(userId: string, eventId: string): Promise<void> {
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/users/${encodeURIComponent(userId)}/events/${encodeURIComponent(eventId)}`,
    });
  }
}
