# MemoryKit TypeScript SDK

The official TypeScript SDK for [MemoryKit](https://memorykit.io) — memory infrastructure for AI applications.

[![npm version](https://img.shields.io/npm/v/memorykit.svg)](https://www.npmjs.com/package/memorykit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install memorykit
```

```bash
yarn add memorykit
```

```bash
pnpm add memorykit
```

## Requirements

- Node.js 18+ (uses native `fetch`)
- Also works in Bun, Deno, Cloudflare Workers, and Vercel Edge Runtime

## Quick Start

```typescript
import { MemoryKit } from "memorykit";

const mk = new MemoryKit({ apiKey: process.env.MEMORYKIT_API_KEY! });

// Create a memory
const memory = await mk.memories.create({
  content: "TypeScript was created by Anders Hejlsberg at Microsoft.",
  tags: ["programming", "typescript"],
  userId: "user_123",
});

// Query your memories with RAG
const answer = await mk.memories.query({
  query: "Who created TypeScript?",
  mode: "balanced",
  maxSources: 5,
});

console.log(answer.answer);
console.log(answer.sources);
```

## Configuration

```typescript
const mk = new MemoryKit({
  apiKey: "ctx_...",         // Required. Your API key.
  baseUrl: "https://...",    // Optional. Default: https://api.memorykit.io/v1
  timeout: 30000,            // Optional. Request timeout in ms. Default: 30000
  maxRetries: 3,             // Optional. Auto-retries on 429/5xx. Default: 3
});
```

## API Reference

### Memories

```typescript
// Create a memory
const memory = await mk.memories.create({
  content: "...",
  title: "My Memory",
  type: "text",
  tags: ["tag1", "tag2"],
  metadata: { source: "api" },
  userId: "user_123",
  language: "en",
  format: "markdown",
});

// Batch ingest (up to 100)
const batch = await mk.memories.batchIngest({
  items: [
    { content: "First memory" },
    { content: "Second memory" },
  ],
  defaults: { tags: ["batch"], userId: "user_123" },
});

// Upload a file
const file = new File(["content"], "document.txt", { type: "text/plain" });
const uploaded = await mk.memories.upload({
  file,
  title: "My Document",
  tags: ["documents"],
});

// List memories (cursor-based pagination)
const list = await mk.memories.list({
  limit: 20,
  status: "completed",
  userId: "user_123",
});

// Paginate through all memories
let cursor: string | null = null;
do {
  const page = await mk.memories.list({ limit: 50, cursor: cursor ?? undefined });
  for (const mem of page.data) {
    console.log(mem.title);
  }
  cursor = page.cursor;
} while (cursor);

// Get a single memory
const mem = await mk.memories.get("mem_abc123");

// Update a memory
const updated = await mk.memories.update("mem_abc123", {
  title: "Updated Title",
  tags: ["updated"],
});

// Reprocess a memory
await mk.memories.reprocess("mem_abc123");

// Delete a memory
await mk.memories.delete("mem_abc123");
```

### Query (RAG)

```typescript
const answer = await mk.memories.query({
  query: "What are the key features?",
  maxSources: 10,
  temperature: 0.7,
  mode: "balanced",           // "fast" | "balanced" | "thorough"
  userId: "user_123",
  instructions: "Be concise.",
  responseFormat: "markdown",
  includeGraph: true,
  filters: {
    tags: ["product"],
    type: "document",
    metadata: { category: "features" },
    memoryIds: ["mem_1", "mem_2"],
  },
});

console.log(answer.answer);
console.log(answer.confidence);
console.log(answer.sources);
console.log(answer.usage);
```

### Search

```typescript
const results = await mk.memories.search({
  query: "typescript best practices",
  limit: 10,
  scoreThreshold: 0.5,
  includeGraph: true,
  filters: { tags: ["programming"] },
  userId: "user_123",
});

for (const result of results.results) {
  console.log(`${result.title} (score: ${result.score})`);
}

if (results.graph) {
  console.log("Knowledge graph:", results.graph.nodes, results.graph.edges);
}
```

### Streaming

```typescript
// Stream a RAG query
for await (const event of await mk.memories.stream({
  query: "Explain the architecture",
  mode: "balanced",
})) {
  switch (event.event) {
    case "text":
      process.stdout.write(event.data.content);
      break;
    case "sources":
      console.log("\nSources:", event.data.sources);
      break;
    case "usage":
      console.log("\nTokens used:", event.data.totalTokens);
      break;
    case "done":
      console.log("\n--- Done ---");
      break;
    case "error":
      console.error("Error:", event.data.message);
      break;
  }
}
```

### Chats

```typescript
// Create a chat session
const chat = await mk.chats.create({
  userId: "user_123",
  title: "Support Chat",
  metadata: { topic: "billing" },
});

// Send a message
const response = await mk.chats.sendMessage(chat.id, {
  message: "How do I upgrade my plan?",
  mode: "balanced",
  maxSources: 5,
});
console.log(response.message.content);
console.log(response.message.sources);

// Stream a chat message
for await (const event of await mk.chats.streamMessage(chat.id, {
  message: "Tell me more about the enterprise plan",
})) {
  if (event.event === "text") {
    process.stdout.write(event.data.content);
  }
}

// Get full chat history
const history = await mk.chats.getHistory(chat.id);
for (const msg of history.messages) {
  console.log(`${msg.role}: ${msg.content}`);
}

// List chats
const chats = await mk.chats.list({ userId: "user_123", limit: 10 });

// Delete a chat
await mk.chats.delete(chat.id);
```

### Users

```typescript
// Upsert a user (idempotent)
const user = await mk.users.upsert({
  id: "user_123",
  email: "alice@example.com",
  name: "Alice",
  metadata: { plan: "pro", company: "Acme" },
});

// Get a user
const fetched = await mk.users.get("user_123");

// Update a user
const updated = await mk.users.update("user_123", {
  name: "Alice Smith",
  metadata: { plan: "enterprise" },
});

// Delete a user (with cascade to delete their memories and chats)
await mk.users.delete("user_123", { cascade: true });
```

### User Events

```typescript
// Track a user event
const event = await mk.users.createEvent("user_123", {
  type: "page_view",
  data: { page: "/settings", duration: 30 },
});

// List events
const events = await mk.users.listEvents("user_123", {
  limit: 50,
  type: "page_view",
});

// Delete an event
await mk.users.deleteEvent("user_123", event.id);
```

### Webhooks

```typescript
// Register a webhook
const webhook = await mk.webhooks.create({
  url: "https://example.com/webhooks/memorykit",
  events: ["memory.completed", "memory.failed"],
});
console.log("Signing secret:", webhook.secret);

// List webhooks
const webhooks = await mk.webhooks.list();

// Get a webhook
const wh = await mk.webhooks.get(webhook.id);

// Test a webhook
const test = await mk.webhooks.test(webhook.id);
console.log("Test result:", test.success, test.statusCode);

// Delete a webhook
await mk.webhooks.delete(webhook.id);
```

### Status

```typescript
const status = await mk.status.get();
console.log(`Memories: ${status.usage.memories}/${status.usage.memoriesLimit}`);
console.log(`Queries: ${status.usage.queries}/${status.usage.queriesLimit}`);
console.log(`Plan: ${status.plan}`);
```

### Feedback

```typescript
// Submit feedback on a query response
await mk.feedback.create({
  requestId: "req_abc123",  // from query/chat response
  rating: 5,
  comment: "Very accurate and helpful answer",
});
```

## Error Handling

The SDK throws typed errors for different failure scenarios:

```typescript
import {
  MemoryKit,
  MemoryKitError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  ServerError,
} from "memorykit";

try {
  await mk.memories.get("mem_nonexistent");
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log("Memory not found:", error.message);
    console.log("Status:", error.statusCode);    // 404
    console.log("Request ID:", error.requestId);
  } else if (error instanceof AuthenticationError) {
    console.log("Bad API key:", error.message);
  } else if (error instanceof RateLimitError) {
    console.log("Rate limited. Retry after:", error.retryAfter, "seconds");
  } else if (error instanceof ValidationError) {
    console.log("Validation errors:", error.errors);
  } else if (error instanceof ServerError) {
    console.log("Server error:", error.statusCode);
  } else if (error instanceof MemoryKitError) {
    console.log("Generic error:", error.message, error.statusCode);
  }
}
```

### Automatic Retries

The SDK automatically retries on HTTP 429 (rate limit) and 5xx (server error) responses with exponential backoff. Configure with `maxRetries`:

```typescript
const mk = new MemoryKit({
  apiKey: "ctx_...",
  maxRetries: 5,   // default: 3
  timeout: 60000,  // default: 30000ms
});
```

## TypeScript

The SDK is written in TypeScript and exports all types. IntelliSense and type checking work out of the box:

```typescript
import type {
  Memory,
  QueryResponse,
  SearchResponse,
  StreamEvent,
  Chat,
  ChatMessage,
  User,
  Webhook,
} from "memorykit";
```

## Runtime Compatibility

| Runtime              | Supported |
|---------------------|-----------|
| Node.js 18+        | Yes       |
| Bun                 | Yes       |
| Deno                | Yes       |
| Cloudflare Workers  | Yes       |
| Vercel Edge Runtime | Yes       |

## Links

- [Documentation](https://docs.memorykit.io)
- [API Reference](https://docs.memorykit.io/api-reference)
- [Dashboard](https://platform.memorykit.io)
- [GitHub](https://github.com/MemoryKitIO/memorykit-typescript-sdk)

## License

MIT
