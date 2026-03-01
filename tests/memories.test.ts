import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoriesResource } from '../src/resources/memories.js';
import type { HttpClient } from '../src/client.js';
import type {
  Memory,
  PaginatedList,
  QueryResponse,
  SearchResponse,
  BatchIngestResponse,
} from '../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal Memory object returned by the "API". */
function fakeMemory(overrides?: Partial<Memory>): Memory {
  return {
    id: 'mem_abc123',
    title: 'Test Memory',
    type: 'text',
    status: 'completed',
    tags: ['test'],
    metadata: {},
    userId: null,
    language: null,
    format: null,
    chunksCount: 3,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function fakeQueryResponse(): QueryResponse {
  return {
    answer: 'The answer is 42.',
    confidence: 0.95,
    sources: [
      {
        memoryId: 'mem_abc123',
        memoryTitle: 'Test Memory',
        content: 'chunk text',
        score: 0.92,
        tags: [],
        metadata: {},
      },
    ],
    model: 'gpt-4o-mini',
    requestId: 'req_xyz',
    usage: {
      totalTimeMs: 230,
      retrievalTimeMs: 50,
      generationTimeMs: 180,
      tokensUsed: 120,
      estimatedCostUsd: 0.0001,
      modeUsed: 'fast',
      sourcesFound: 1,
      graphEntitiesFound: null,
      graphRelationshipsFound: null,
      graphEnrichmentMs: null,
    },
  };
}

function fakeSearchResponse(): SearchResponse {
  return {
    results: [
      {
        memoryId: 'mem_abc123',
        memoryTitle: 'Test Memory',
        content: 'matched text',
        score: 0.88,
        metadata: {},
        tags: ['test'],
      },
    ],
    graph: null,
    requestId: 'req_search_1',
    processingTimeMs: 45,
    totalResults: 1,
  };
}

/** Create a mock HttpClient with a stubbed `request` method. */
function createMockClient() {
  return {
    request: vi.fn(),
    stream: vi.fn(),
  } as unknown as HttpClient & {
    request: ReturnType<typeof vi.fn>;
    stream: ReturnType<typeof vi.fn>;
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MemoriesResource', () => {
  let client: ReturnType<typeof createMockClient>;
  let memories: MemoriesResource;

  beforeEach(() => {
    client = createMockClient();
    memories = new MemoriesResource(client);
  });

  // -----------------------------------------------------------------------
  // create()
  // -----------------------------------------------------------------------

  describe('create()', () => {
    it('sends POST /v1/memories with correct body', async () => {
      const expected = fakeMemory({ status: 'pending' });
      client.request.mockResolvedValue(expected);

      const result = await memories.create({
        content: 'Hello world',
        title: 'Greeting',
        tags: ['greet'],
      });

      expect(client.request).toHaveBeenCalledOnce();
      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/memories',
        body: {
          content: 'Hello world',
          title: 'Greeting',
          tags: ['greet'],
        },
      });
      expect(result).toEqual(expected);
    });

    it('sends minimal body when only content provided', async () => {
      client.request.mockResolvedValue(fakeMemory());

      await memories.create({ content: 'Just text' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/memories',
        body: { content: 'Just text' },
      });
    });

    it('passes all optional parameters', async () => {
      client.request.mockResolvedValue(fakeMemory());

      await memories.create({
        content: 'Code snippet',
        title: 'My code',
        type: 'code',
        tags: ['python', 'snippet'],
        metadata: { source: 'github' },
        userId: 'user_42',
        language: 'en',
        format: 'markdown',
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/memories',
        body: {
          content: 'Code snippet',
          title: 'My code',
          type: 'code',
          tags: ['python', 'snippet'],
          metadata: { source: 'github' },
          userId: 'user_42',
          language: 'en',
          format: 'markdown',
        },
      });
    });
  });

  // -----------------------------------------------------------------------
  // batchCreate()
  // -----------------------------------------------------------------------

  describe('batchCreate()', () => {
    it('sends POST /v1/memories/batch with items array', async () => {
      const batchResponse: BatchIngestResponse = {
        items: [
          { id: 'mem_1', title: 'A', status: 'pending', index: 0 },
          { id: 'mem_2', title: 'B', status: 'pending', index: 1 },
        ],
        total: 2,
        failed: 0,
      };
      client.request.mockResolvedValue(batchResponse);

      const result = await memories.batchCreate({
        items: [
          { content: 'First' },
          { content: 'Second' },
        ],
        defaults: { type: 'text', tags: ['batch'] },
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/memories/batch',
        body: {
          items: [{ content: 'First' }, { content: 'Second' }],
          defaults: { type: 'text', tags: ['batch'] },
        },
      });
      expect(result.total).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.items).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // list()
  // -----------------------------------------------------------------------

  describe('list()', () => {
    it('sends GET /v1/memories with no params when called empty', async () => {
      const page: PaginatedList<Memory> = {
        data: [fakeMemory()],
        hasMore: false,
      };
      client.request.mockResolvedValue(page);

      const result = await memories.list();

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/memories',
        query: undefined,
      });
      expect(result.data).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('passes pagination and filter query params', async () => {
      const page: PaginatedList<Memory> = {
        data: [fakeMemory(), fakeMemory({ id: 'mem_def456' })],
        hasMore: true,
      };
      client.request.mockResolvedValue(page);

      const result = await memories.list({
        limit: 2,
        status: 'completed',
        type: 'text',
        userId: 'user_1',
        startingAfter: 'mem_000',
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/memories',
        query: {
          limit: 2,
          status: 'completed',
          type: 'text',
          userId: 'user_1',
          startingAfter: 'mem_000',
        },
      });
      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // get()
  // -----------------------------------------------------------------------

  describe('get()', () => {
    it('sends GET /v1/memories/:id', async () => {
      const expected = fakeMemory({ id: 'mem_xyz' });
      client.request.mockResolvedValue(expected);

      const result = await memories.get('mem_xyz');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/memories/mem_xyz',
      });
      expect(result.id).toBe('mem_xyz');
    });

    it('encodes special characters in ID', async () => {
      client.request.mockResolvedValue(fakeMemory());

      await memories.get('mem/special id');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/memories/mem%2Fspecial%20id',
      });
    });
  });

  // -----------------------------------------------------------------------
  // update()
  // -----------------------------------------------------------------------

  describe('update()', () => {
    it('sends PUT /v1/memories/:id with body', async () => {
      const expected = fakeMemory({ title: 'Updated Title' });
      client.request.mockResolvedValue(expected);

      const result = await memories.update('mem_abc123', {
        title: 'Updated Title',
        tags: ['updated'],
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/v1/memories/mem_abc123',
        body: { title: 'Updated Title', tags: ['updated'] },
      });
      expect(result.title).toBe('Updated Title');
    });
  });

  // -----------------------------------------------------------------------
  // delete()
  // -----------------------------------------------------------------------

  describe('delete()', () => {
    it('sends DELETE /v1/memories/:id', async () => {
      client.request.mockResolvedValue(undefined);

      await memories.delete('mem_abc123');

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/v1/memories/mem_abc123',
      });
    });

    it('returns void (undefined)', async () => {
      client.request.mockResolvedValue(undefined);
      const result = await memories.delete('mem_abc123');
      expect(result).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // reprocess()
  // -----------------------------------------------------------------------

  describe('reprocess()', () => {
    it('sends POST /v1/memories/:id/reprocess', async () => {
      const expected = fakeMemory({ status: 'processing' });
      client.request.mockResolvedValue(expected);

      const result = await memories.reprocess('mem_abc123');

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/memories/mem_abc123/reprocess',
      });
      expect(result.status).toBe('processing');
    });
  });

  // -----------------------------------------------------------------------
  // query()
  // -----------------------------------------------------------------------

  describe('query()', () => {
    it('sends POST /v1/memories/query with query string', async () => {
      const expected = fakeQueryResponse();
      client.request.mockResolvedValue(expected);

      const result = await memories.query({ query: 'What is the meaning of life?' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/memories/query',
        body: { query: 'What is the meaning of life?' },
      });
      expect(result.answer).toBe('The answer is 42.');
      expect(result.confidence).toBe(0.95);
      expect(result.sources).toHaveLength(1);
    });

    it('passes all optional query parameters', async () => {
      client.request.mockResolvedValue(fakeQueryResponse());

      await memories.query({
        query: 'Test query',
        maxSources: 5,
        temperature: 0.7,
        mode: 'precise',
        userId: 'user_1',
        instructions: 'Be concise',
        responseFormat: 'markdown',
        includeGraph: true,
        filters: {
          tags: ['important'],
          type: 'document',
          metadata: { category: 'science' },
        },
        model: 'gpt-4o',
        history: [
          { role: 'user', content: 'Previous question' },
          { role: 'assistant', content: 'Previous answer' },
        ],
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/memories/query',
        body: {
          query: 'Test query',
          maxSources: 5,
          temperature: 0.7,
          mode: 'precise',
          userId: 'user_1',
          instructions: 'Be concise',
          responseFormat: 'markdown',
          includeGraph: true,
          filters: {
            tags: ['important'],
            type: 'document',
            metadata: { category: 'science' },
          },
          model: 'gpt-4o',
          history: [
            { role: 'user', content: 'Previous question' },
            { role: 'assistant', content: 'Previous answer' },
          ],
        },
      });
    });

    it('returns parsed QueryResponse with usage stats', async () => {
      const expected = fakeQueryResponse();
      client.request.mockResolvedValue(expected);

      const result = await memories.query({ query: 'test' });

      expect(result.usage.totalTimeMs).toBe(230);
      expect(result.usage.tokensUsed).toBe(120);
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.requestId).toBe('req_xyz');
    });
  });

  // -----------------------------------------------------------------------
  // search()
  // -----------------------------------------------------------------------

  describe('search()', () => {
    it('sends POST /v1/memories/search with query', async () => {
      const expected = fakeSearchResponse();
      client.request.mockResolvedValue(expected);

      const result = await memories.search({ query: 'find something' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/memories/search',
        body: { query: 'find something' },
      });
      expect(result.results).toHaveLength(1);
      expect(result.results[0].score).toBe(0.88);
      expect(result.totalResults).toBe(1);
    });

    it('passes search options', async () => {
      client.request.mockResolvedValue(fakeSearchResponse());

      await memories.search({
        query: 'test',
        limit: 20,
        scoreThreshold: 0.5,
        includeGraph: true,
        filters: { tags: ['important'] },
        userId: 'user_1',
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/memories/search',
        body: {
          query: 'test',
          limit: 20,
          scoreThreshold: 0.5,
          includeGraph: true,
          filters: { tags: ['important'] },
          userId: 'user_1',
        },
      });
    });
  });

  // -----------------------------------------------------------------------
  // stream()
  // -----------------------------------------------------------------------

  describe('stream()', () => {
    it('delegates to client.stream() with stream=true in body', async () => {
      const fakeIterable = (async function* () {
        yield { event: 'text' as const, data: { content: 'Hello' } };
        yield { event: 'done' as const, data: {} };
      })();
      client.stream.mockResolvedValue(fakeIterable);

      const result = await memories.stream({ query: 'test stream' });

      expect(client.stream).toHaveBeenCalledOnce();
      expect(client.stream).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/memories/query',
        body: { query: 'test stream', stream: true },
      });

      // Consume the iterable to verify it works
      const events = [];
      for await (const event of result) {
        events.push(event);
      }
      expect(events).toHaveLength(2);
      expect(events[0].event).toBe('text');
    });
  });

  // -----------------------------------------------------------------------
  // Error propagation
  // -----------------------------------------------------------------------

  describe('error propagation', () => {
    it('propagates errors from HttpClient', async () => {
      const error = new Error('Network failure');
      client.request.mockRejectedValue(error);

      await expect(memories.create({ content: 'test' })).rejects.toThrow('Network failure');
    });

    it('propagates errors for get()', async () => {
      const error = new Error('Not found');
      client.request.mockRejectedValue(error);

      await expect(memories.get('nonexistent')).rejects.toThrow('Not found');
    });

    it('propagates errors for query()', async () => {
      const error = new Error('Rate limited');
      client.request.mockRejectedValue(error);

      await expect(memories.query({ query: 'test' })).rejects.toThrow('Rate limited');
    });
  });
});
