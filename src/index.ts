import { HttpClient } from './client.js';
import { MemoriesResource } from './resources/memories.js';
import { ChatsResource } from './resources/chats.js';
import { UsersResource } from './resources/users.js';
import { WebhooksResource } from './resources/webhooks.js';
import { StatusResource } from './resources/status.js';
import { FeedbackResource } from './resources/feedback.js';
import type { MemoryKitOptions } from './types.js';

/**
 * The MemoryKit SDK client.
 *
 * @example
 * ```ts
 * import { MemoryKit } from "memorykit";
 *
 * const mk = new MemoryKit({ apiKey: process.env.MEMORYKIT_API_KEY });
 *
 * const memory = await mk.memories.create({ content: "Hello world" });
 * const answer = await mk.memories.query({ query: "What do you know?" });
 * ```
 */
export class MemoryKit {
  /** Memory management, RAG queries, search, and streaming. */
  readonly memories: MemoriesResource;

  /** Chat sessions and message management. */
  readonly chats: ChatsResource;

  /** User management and event tracking. */
  readonly users: UsersResource;

  /** Webhook registration and testing. */
  readonly webhooks: WebhooksResource;

  /** Project usage and billing status. */
  readonly status: StatusResource;

  /** Feedback on query and chat responses. */
  readonly feedback: FeedbackResource;

  constructor(options: MemoryKitOptions) {
    const client = new HttpClient(options);

    this.memories = new MemoriesResource(client);
    this.chats = new ChatsResource(client);
    this.users = new UsersResource(client);
    this.webhooks = new WebhooksResource(client);
    this.status = new StatusResource(client);
    this.feedback = new FeedbackResource(client);
  }
}

// ---------------------------------------------------------------------------
// Re-export everything consumers might need
// ---------------------------------------------------------------------------

// Main client
export { MemoryKit as default };

// Errors
export {
  MemoryKitError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  ServerError,
} from './errors.js';

// Types
export type {
  MemoryKitOptions,
  Metadata,
  PaginatedList,

  // Memories
  Memory,
  MemoryStatus,
  MemoryType,
  MemoryFormat,
  CreateMemoryParams,
  BatchIngestParams,
  BatchIngestResponse,
  UploadMemoryParams,
  ListMemoriesParams,
  UpdateMemoryParams,

  // Query & Search
  QueryMode,
  ResponseFormat,
  QueryFilters,
  QueryParams,
  QuerySource,
  QueryUsage,
  QueryResponse,
  SearchParams,
  SearchResult,
  SearchResponse,
  GraphNode,
  GraphEdge,
  GraphData,

  // Streaming
  StreamEvent,
  StreamTextEvent,
  StreamSourcesEvent,
  StreamUsageEvent,
  StreamDoneEvent,
  StreamErrorEvent,

  // Chats
  Chat,
  CreateChatParams,
  ListChatsParams,
  ChatMessage,
  ChatHistory,
  SendMessageParams,
  SendMessageResponse,

  // Users
  User,
  UpsertUserParams,
  UpdateUserParams,
  DeleteUserOptions,
  UserEvent,
  CreateEventParams,
  ListEventsParams,

  // Webhooks
  Webhook,
  WebhookEventType,
  CreateWebhookParams,
  WebhookTestResult,

  // Status
  ProjectStatus,

  // Feedback
  Feedback,
  CreateFeedbackParams,
} from './types.js';

// Resource classes (advanced usage)
export { MemoriesResource } from './resources/memories.js';
export { ChatsResource } from './resources/chats.js';
export { UsersResource } from './resources/users.js';
export { WebhooksResource } from './resources/webhooks.js';
export { StatusResource } from './resources/status.js';
export { FeedbackResource } from './resources/feedback.js';
