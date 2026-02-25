import type { HttpClient } from '../client.js';
import type {
  Chat,
  CreateChatParams,
  ListChatsParams,
  ChatHistory,
  SendMessageParams,
  SendMessageResponse,
  PaginatedList,
  StreamEvent,
} from '../types.js';

/**
 * Resource class for the `/v1/chats` endpoints.
 *
 * @example
 * ```ts
 * const chat = await mk.chats.create({ userId: "user_123", title: "Support" });
 * const response = await mk.chats.sendMessage(chat.id, { message: "Hello" });
 * ```
 */
export class ChatsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Create a new chat session.
   */
  async create(params?: CreateChatParams): Promise<Chat> {
    return this.client.request<Chat>({
      method: 'POST',
      path: '/v1/chats',
      body: params ?? {},
    });
  }

  /**
   * List chats with cursor-based pagination.
   */
  async list(params?: ListChatsParams): Promise<PaginatedList<Chat>> {
    return this.client.request<PaginatedList<Chat>>({
      method: 'GET',
      path: '/v1/chats',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Get a chat's full history including all messages.
   */
  async getHistory(id: string): Promise<ChatHistory> {
    return this.client.request<ChatHistory>({
      method: 'GET',
      path: `/v1/chats/${encodeURIComponent(id)}/messages`,
    });
  }

  /**
   * Send a message to a chat and receive the assistant's response.
   */
  async sendMessage(chatId: string, params: SendMessageParams): Promise<SendMessageResponse> {
    return this.client.request<SendMessageResponse>({
      method: 'POST',
      path: `/v1/chats/${encodeURIComponent(chatId)}/messages`,
      body: params,
    });
  }

  /**
   * Stream a message response as Server-Sent Events.
   *
   * @example
   * ```ts
   * for await (const event of mk.chats.streamMessage(chatId, { message: "Hello" })) {
   *   if (event.event === "text") {
   *     process.stdout.write(event.data.content);
   *   }
   * }
   * ```
   */
  async streamMessage(chatId: string, params: SendMessageParams): Promise<AsyncIterable<StreamEvent>> {
    return this.client.stream({
      method: 'POST',
      path: `/v1/chats/${encodeURIComponent(chatId)}/messages/stream`,
      body: params,
    });
  }

  /**
   * Soft-delete a chat and all of its messages.
   */
  async delete(id: string): Promise<void> {
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/chats/${encodeURIComponent(id)}`,
    });
  }
}
