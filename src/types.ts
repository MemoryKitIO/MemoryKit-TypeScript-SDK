// ---------------------------------------------------------------------------
// SDK Configuration
// ---------------------------------------------------------------------------

/** Configuration options for the MemoryKit client. */
export interface MemoryKitOptions {
  /** API key starting with `ctx_`. */
  apiKey: string;

  /** Base URL for the API. @default "https://api.memorykit.io/v1" */
  baseUrl?: string;

  /** Request timeout in milliseconds. @default 30000 */
  timeout?: number;

  /** Maximum number of automatic retries for 429 / 5xx responses. @default 3 */
  maxRetries?: number;
}

// ---------------------------------------------------------------------------
// Shared / Generic
// ---------------------------------------------------------------------------

/** Cursor-based paginated list response. */
export interface PaginatedList<T> {
  data: T[];
  hasMore: boolean;
  cursor: string | null;
}

/** Generic key-value metadata object. */
export type Metadata = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Memories
// ---------------------------------------------------------------------------

export type MemoryStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type MemoryType =
  | 'text'
  | 'document'
  | 'conversation'
  | 'code'
  | 'image'
  | string;

export type MemoryFormat =
  | 'text'
  | 'markdown'
  | 'html'
  | string;

export interface Memory {
  id: string;
  title: string | null;
  content: string | null;
  type: MemoryType;
  status: MemoryStatus;
  tags: string[];
  metadata: Metadata;
  userId: string | null;
  language: string | null;
  format: MemoryFormat | null;
  tokenCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryParams {
  content: string;
  title?: string;
  type?: MemoryType;
  tags?: string[];
  metadata?: Metadata;
  userId?: string;
  language?: string;
  format?: MemoryFormat;
}

export interface BatchIngestParams {
  items: CreateMemoryParams[];
  defaults?: Omit<CreateMemoryParams, 'content'>;
}

export interface BatchIngestResponse {
  accepted: number;
  rejected: number;
  errors: Array<{ index: number; message: string }>;
}

export interface UploadMemoryParams {
  file: Blob | File;
  title?: string;
  type?: MemoryType;
  tags?: string[];
  metadata?: Metadata;
  language?: string;
  userId?: string;
}

export interface ListMemoriesParams {
  limit?: number;
  cursor?: string;
  status?: MemoryStatus;
  type?: MemoryType;
  userId?: string;
}

export interface UpdateMemoryParams {
  title?: string;
  type?: MemoryType;
  tags?: string[];
  metadata?: Metadata;
  content?: string;
}

// ---------------------------------------------------------------------------
// Query & Search
// ---------------------------------------------------------------------------

// V2: query types disabled for initial launch
// export type QueryMode = 'fast' | 'balanced' | 'precise' | string;
// export type ResponseFormat = 'text' | 'markdown' | 'json' | string;

// V2: QueryFilters removed — search now uses flat query params
// export interface QueryFilters {
//   metadata?: Metadata;
//   tags?: string[];
//   memoryIds?: string[];
//   type?: MemoryType;
// }

// V2: query types disabled for initial launch
// export interface QueryParams {
//   query: string;
//   maxSources?: number;
//   temperature?: number;
//   mode?: QueryMode;
//   userId?: string;
//   instructions?: string;
//   responseFormat?: ResponseFormat;
//   includeGraph?: boolean;
//   filters?: QueryFilters;
// }

// export interface QuerySource {
//   memoryId: string;
//   title: string | null;
//   content: string;
//   score: number;
//   metadata: Metadata;
// }

// export interface QueryUsage {
//   promptTokens: number;
//   completionTokens: number;
//   totalTokens: number;
// }

// export interface QueryResponse {
//   answer: string;
//   confidence: number;
//   sources: QuerySource[];
//   model: string;
//   requestId: string;
//   usage: QueryUsage;
// }

export type SearchPrecision = 'low' | 'medium' | 'high';

export interface SearchParams {
  /** Search query (required). */
  query: string;

  /** Result precision level. @default "medium" */
  precision?: SearchPrecision;

  /** Maximum number of results (1-100). @default 10 */
  limit?: number;

  /** Scope results to a specific user. */
  userId?: string;

  /** Filter by memory type. */
  type?: MemoryType;

  /** Comma-separated tags to filter by. */
  tags?: string;

  /** Only include memories created after this ISO 8601 timestamp. */
  createdAfter?: string;

  /** Only include memories created before this ISO 8601 timestamp. */
  createdBefore?: string;

  /** Include knowledge graph data in the response. */
  includeGraph?: boolean;
}

export interface SearchResult {
  memoryId: string;
  title: string | null;
  content: string;
  score: number;
  metadata: Metadata;
  tags: string[];
  type: MemoryType;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SearchResponse {
  results: SearchResult[];
  graph: GraphData | null;
  requestId: string;
  totalResults: number;
}

// ---------------------------------------------------------------------------
// Streaming (SSE)
// ---------------------------------------------------------------------------

export interface StreamTextEvent {
  event: 'text';
  data: { content: string };
}

export interface StreamSourcesEvent {
  event: 'sources';
  data: { sources: unknown[] };
}

export interface StreamUsageEvent {
  event: 'usage';
  data: Record<string, unknown>;
}

export interface StreamDoneEvent {
  event: 'done';
  data: Record<string, never>;
}

export interface StreamErrorEvent {
  event: 'error';
  data: { message: string; code?: string };
}

export type StreamEvent =
  | StreamTextEvent
  | StreamSourcesEvent
  | StreamUsageEvent
  | StreamDoneEvent
  | StreamErrorEvent;

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

// V2: chat types disabled for initial launch
// export interface Chat {
//   id: string;
//   userId: string | null;
//   title: string | null;
//   metadata: Metadata;
//   createdAt: string;
//   updatedAt: string;
// }
//
// export interface CreateChatParams {
//   userId?: string;
//   title?: string;
//   metadata?: Metadata;
// }
//
// export interface ListChatsParams {
//   userId?: string;
//   limit?: number;
//   cursor?: string;
// }
//
// export interface ChatMessage {
//   id: string;
//   role: 'user' | 'assistant';
//   content: string;
//   sources: QuerySource[] | null;
//   createdAt: string;
// }
//
// export interface ChatHistory {
//   id: string;
//   userId: string | null;
//   title: string | null;
//   metadata: Metadata;
//   messages: ChatMessage[];
//   createdAt: string;
//   updatedAt: string;
// }
//
// export interface SendMessageParams {
//   message: string;
//   mode?: QueryMode;
//   maxSources?: number;
//   temperature?: number;
//   userId?: string;
//   instructions?: string;
//   responseFormat?: ResponseFormat;
//   filters?: QueryFilters;
// }
//
// export interface SendMessageResponse {
//   message: ChatMessage;
// }

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  metadata: Metadata;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertUserParams {
  id: string;
  email?: string;
  name?: string;
  metadata?: Metadata;
}

export interface UpdateUserParams {
  email?: string;
  name?: string;
  metadata?: Metadata;
}

export interface DeleteUserOptions {
  cascade?: boolean;
}

// ---------------------------------------------------------------------------
// User Events
// ---------------------------------------------------------------------------

export interface UserEvent {
  id: string;
  userId: string;
  type: string;
  data: Metadata;
  createdAt: string;
}

export interface CreateEventParams {
  type: string;
  data?: Metadata;
}

export interface ListEventsParams {
  limit?: number;
  type?: string;
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export type WebhookEventType =
  | 'memory.created'
  | 'memory.completed'
  | 'memory.failed'
  | 'memory.deleted'
  | string;

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookParams {
  url: string;
  events: WebhookEventType[];
}

export interface WebhookTestResult {
  success: boolean;
  statusCode: number;
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export interface ProjectStatus {
  projectId: string;
  plan: string;
  usage: {
    memories: number;
    memoriesLimit: number;
    queries: number;
    queriesLimit: number;
    storage: number;
    storageLimit: number;
  };
  billing: {
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export interface Feedback {
  id: string;
  requestId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface CreateFeedbackParams {
  requestId: string;
  rating: number;
  comment?: string;
}
