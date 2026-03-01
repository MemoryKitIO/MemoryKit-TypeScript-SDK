import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackResource } from '../src/resources/feedback.js';
import { StatusResource } from '../src/resources/status.js';
import type { HttpClient } from '../src/client.js';
import type { Feedback, ProjectStatus } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockClient() {
  return {
    request: vi.fn(),
    stream: vi.fn(),
  } as unknown as HttpClient & {
    request: ReturnType<typeof vi.fn>;
    stream: ReturnType<typeof vi.fn>;
  };
}

function fakeFeedback(overrides?: Partial<Feedback>): Feedback {
  return {
    id: 'fb_abc123',
    requestId: 'req_xyz',
    rating: 'positive',
    comment: 'Great answer!',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function fakeProjectStatus(): ProjectStatus {
  return {
    project: 'My Project',
    plan: 'pro',
    usage: {
      memoriesTotal: 150,
      memoriesLimit: 10000,
      memoriesToday: 5,
      queriesThisMonth: 320,
      queriesLimit: 50000,
      storageMb: 45.2,
      storageLimitMb: 1024,
    },
    knowledge: {
      analyzedDocuments: 100,
      topTags: ['api', 'docs', 'tutorial'],
      languages: ['en', 'ru'],
      contextTypes: { text: 80, document: 20 },
      documents: ['doc1.pdf', 'readme.md'],
    },
  };
}

// ---------------------------------------------------------------------------
// FeedbackResource
// ---------------------------------------------------------------------------

describe('FeedbackResource', () => {
  let client: ReturnType<typeof createMockClient>;
  let feedback: FeedbackResource;

  beforeEach(() => {
    client = createMockClient();
    feedback = new FeedbackResource(client);
  });

  describe('create()', () => {
    it('sends POST /v1/feedback with rating and requestId', async () => {
      const expected = fakeFeedback();
      client.request.mockResolvedValue(expected);

      const result = await feedback.create({
        requestId: 'req_xyz',
        rating: 'positive',
      });

      expect(client.request).toHaveBeenCalledOnce();
      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/feedback',
        body: {
          requestId: 'req_xyz',
          rating: 'positive',
        },
      });
      expect(result.id).toBe('fb_abc123');
      expect(result.rating).toBe('positive');
    });

    it('sends negative rating with comment', async () => {
      const expected = fakeFeedback({
        rating: 'negative',
        comment: 'Answer was wrong',
      });
      client.request.mockResolvedValue(expected);

      const result = await feedback.create({
        requestId: 'req_456',
        rating: 'negative',
        comment: 'Answer was wrong',
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/v1/feedback',
        body: {
          requestId: 'req_456',
          rating: 'negative',
          comment: 'Answer was wrong',
        },
      });
      expect(result.rating).toBe('negative');
      expect(result.comment).toBe('Answer was wrong');
    });

    it('returns correct Feedback type structure', async () => {
      const expected = fakeFeedback();
      client.request.mockResolvedValue(expected);

      const result = await feedback.create({
        requestId: 'req_xyz',
        rating: 'positive',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('requestId');
      expect(result).toHaveProperty('rating');
      expect(result).toHaveProperty('comment');
      expect(result).toHaveProperty('createdAt');
    });

    it('propagates errors from HttpClient', async () => {
      client.request.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        feedback.create({ requestId: 'req_1', rating: 'positive' }),
      ).rejects.toThrow('Unauthorized');
    });
  });
});

// ---------------------------------------------------------------------------
// StatusResource
// ---------------------------------------------------------------------------

describe('StatusResource', () => {
  let client: ReturnType<typeof createMockClient>;
  let status: StatusResource;

  beforeEach(() => {
    client = createMockClient();
    status = new StatusResource(client);
  });

  describe('get()', () => {
    it('sends GET /v1/status', async () => {
      const expected = fakeProjectStatus();
      client.request.mockResolvedValue(expected);

      const result = await status.get();

      expect(client.request).toHaveBeenCalledOnce();
      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/v1/status',
      });
      expect(result.project).toBe('My Project');
      expect(result.plan).toBe('pro');
    });

    it('returns usage statistics', async () => {
      client.request.mockResolvedValue(fakeProjectStatus());

      const result = await status.get();

      expect(result.usage.memoriesTotal).toBe(150);
      expect(result.usage.memoriesLimit).toBe(10000);
      expect(result.usage.queriesThisMonth).toBe(320);
      expect(result.usage.storageMb).toBe(45.2);
    });

    it('returns knowledge information when present', async () => {
      client.request.mockResolvedValue(fakeProjectStatus());

      const result = await status.get();

      expect(result.knowledge).toBeDefined();
      expect(result.knowledge!.analyzedDocuments).toBe(100);
      expect(result.knowledge!.topTags).toContain('api');
      expect(result.knowledge!.languages).toContain('en');
    });

    it('handles response without knowledge field', async () => {
      const statusWithoutKnowledge: ProjectStatus = {
        project: 'Empty Project',
        plan: 'free',
        usage: {
          memoriesTotal: 0,
          memoriesLimit: 100,
          memoriesToday: 0,
          queriesThisMonth: 0,
          queriesLimit: 1000,
          storageMb: 0,
          storageLimitMb: 50,
        },
      };
      client.request.mockResolvedValue(statusWithoutKnowledge);

      const result = await status.get();

      expect(result.knowledge).toBeUndefined();
      expect(result.usage.memoriesTotal).toBe(0);
    });

    it('propagates errors from HttpClient', async () => {
      client.request.mockRejectedValue(new Error('Server error'));

      await expect(status.get()).rejects.toThrow('Server error');
    });
  });
});
