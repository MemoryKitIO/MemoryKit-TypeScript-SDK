import type { HttpClient } from '../client.js';
import type {
  Memory,
  CreateMemoryParams,
  BatchIngestParams,
  BatchIngestResponse,
  UploadMemoryParams,
  ListMemoriesParams,
  UpdateMemoryParams,
  PaginatedList,
  QueryParams,
  QueryResponse,
  SearchParams,
  SearchResponse,
  StreamEvent,
} from '../types.js';

/**
 * Resource class for the `/v1/memories` endpoints.
 *
 * @example
 * ```ts
 * const memory = await mk.memories.create({ content: "Hello world" });
 * const list = await mk.memories.list({ limit: 10 });
 * ```
 */
export class MemoriesResource {
  constructor(private readonly client: HttpClient) {}

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  /**
   * Create a new memory.
   * Returns immediately with HTTP 202 — the memory will be processed asynchronously.
   */
  async create(params: CreateMemoryParams): Promise<Memory> {
    return this.client.request<Memory>({
      method: 'POST',
      path: '/v1/memories',
      body: params,
    });
  }

  /**
   * Batch-ingest up to 100 memories at once.
   */
  async batchIngest(params: BatchIngestParams): Promise<BatchIngestResponse> {
    return this.client.request<BatchIngestResponse>({
      method: 'POST',
      path: '/v1/memories/batch',
      body: params,
    });
  }

  /**
   * Upload a file (multipart/form-data).
   * Returns immediately with HTTP 202.
   */
  async upload(params: UploadMemoryParams): Promise<Memory> {
    const formData = new FormData();
    formData.append('file', params.file);

    if (params.title) formData.append('title', params.title);
    if (params.type) formData.append('type', params.type);
    if (params.language) formData.append('language', params.language);
    if (params.userId) formData.append('userId', params.userId);
    if (params.tags) formData.append('tags', JSON.stringify(params.tags));
    if (params.metadata) formData.append('metadata', JSON.stringify(params.metadata));

    return this.client.request<Memory>({
      method: 'POST',
      path: '/v1/memories/upload',
      body: formData,
    });
  }

  /**
   * List memories with cursor-based pagination.
   */
  async list(params?: ListMemoriesParams): Promise<PaginatedList<Memory>> {
    return this.client.request<PaginatedList<Memory>>({
      method: 'GET',
      path: '/v1/memories',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Get a single memory by ID.
   */
  async get(id: string): Promise<Memory> {
    return this.client.request<Memory>({
      method: 'GET',
      path: `/v1/memories/${encodeURIComponent(id)}`,
    });
  }

  /**
   * Update a memory.
   */
  async update(id: string, params: UpdateMemoryParams): Promise<Memory> {
    return this.client.request<Memory>({
      method: 'PUT',
      path: `/v1/memories/${encodeURIComponent(id)}`,
      body: params,
    });
  }

  /**
   * Reprocess a memory. Returns HTTP 202.
   */
  async reprocess(id: string): Promise<Memory> {
    return this.client.request<Memory>({
      method: 'POST',
      path: `/v1/memories/${encodeURIComponent(id)}/reprocess`,
    });
  }

  /**
   * Soft-delete a memory.
   */
  async delete(id: string): Promise<void> {
    await this.client.request<void>({
      method: 'DELETE',
      path: `/v1/memories/${encodeURIComponent(id)}`,
    });
  }

  // -----------------------------------------------------------------------
  // Query & Search
  // -----------------------------------------------------------------------

  /**
   * Perform a RAG query over your memories.
   */
  async query(params: QueryParams): Promise<QueryResponse> {
    return this.client.request<QueryResponse>({
      method: 'POST',
      path: '/v1/memories/query',
      body: params,
    });
  }

  /**
   * Perform a hybrid search over your memories.
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    return this.client.request<SearchResponse>({
      method: 'POST',
      path: '/v1/memories/search',
      body: params,
    });
  }

  // -----------------------------------------------------------------------
  // Streaming
  // -----------------------------------------------------------------------

  /**
   * Stream a RAG query response as Server-Sent Events.
   *
   * @example
   * ```ts
   * for await (const event of mk.memories.stream({ query: "..." })) {
   *   if (event.event === "text") {
   *     process.stdout.write(event.data.content);
   *   }
   * }
   * ```
   */
  async stream(params: QueryParams): Promise<AsyncIterable<StreamEvent>> {
    return this.client.stream({
      method: 'POST',
      path: '/v1/memories/query',
      body: { ...params, stream: true },
    });
  }
}
