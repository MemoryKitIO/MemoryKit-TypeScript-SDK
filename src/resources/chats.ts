// V2: Chats resource disabled for initial launch.
// The entire chats API (create, list, getHistory, sendMessage, streamMessage, delete)
// will be re-enabled when the LLM-powered chat endpoints are available.

// import type { HttpClient } from '../client.js';
// import type {
//   Chat,
//   CreateChatParams,
//   ListChatsParams,
//   ChatHistory,
//   SendMessageParams,
//   SendMessageResponse,
//   PaginatedList,
//   StreamEvent,
// } from '../types.js';
//
// export class ChatsResource {
//   constructor(private readonly client: HttpClient) {}
//
//   async create(params?: CreateChatParams): Promise<Chat> {
//     return this.client.request<Chat>({
//       method: 'POST',
//       path: '/v1/chats',
//       body: params ?? {},
//     });
//   }
//
//   async list(params?: ListChatsParams): Promise<PaginatedList<Chat>> {
//     return this.client.request<PaginatedList<Chat>>({
//       method: 'GET',
//       path: '/v1/chats',
//       query: params as Record<string, string | number | boolean | undefined>,
//     });
//   }
//
//   async getHistory(id: string): Promise<ChatHistory> {
//     return this.client.request<ChatHistory>({
//       method: 'GET',
//       path: `/v1/chats/${encodeURIComponent(id)}/messages`,
//     });
//   }
//
//   async sendMessage(chatId: string, params: SendMessageParams): Promise<SendMessageResponse> {
//     return this.client.request<SendMessageResponse>({
//       method: 'POST',
//       path: `/v1/chats/${encodeURIComponent(chatId)}/messages`,
//       body: params,
//     });
//   }
//
//   async streamMessage(chatId: string, params: SendMessageParams): Promise<AsyncIterable<StreamEvent>> {
//     return this.client.stream({
//       method: 'POST',
//       path: `/v1/chats/${encodeURIComponent(chatId)}/messages/stream`,
//       body: params,
//     });
//   }
//
//   async delete(id: string): Promise<void> {
//     await this.client.request<void>({
//       method: 'DELETE',
//       path: `/v1/chats/${encodeURIComponent(id)}`,
//     });
//   }
// }
