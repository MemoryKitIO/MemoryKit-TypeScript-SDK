# MemoryKit TypeScript SDK

Official TypeScript SDK for MemoryKit RAG API. Zero runtime dependencies, dual ESM/CJS build.

## Quick Commands
```bash
npm run build           # Build ESM + CJS
npm run build:esm       # Build ESM only
npm run build:cjs       # Build CJS only (with .cjs rename)
npm run typecheck       # Type checking only (no emit)
npm run clean           # Remove dist/
```

## Architecture

```
src/
├── index.ts            # Public exports
├── client.ts           # MemoryKit class — entry point, holds HTTPClient + resources
├── errors.ts           # Error hierarchy (MemoryKitError, APIError, AuthError, etc.)
├── types.ts            # Shared TypeScript types/interfaces
├── sse.ts              # Server-Sent Events parser (streaming responses)
└── resources/          # One file per API resource
    ├── memories.ts     # CRUD + search + query + stream + upload + reprocess
    ├── chats.ts        # CRUD + sendMessage + streamMessage + history
    ├── users.ts        # CRUD + events (create, list, delete)
    ├── webhooks.ts     # CRUD + test
    ├── feedback.ts     # submit()
    └── status.ts       # get()
```

## Conventions

- **Resource pattern**: Each resource class takes an HTTPClient, exposes async methods that map 1:1 to API endpoints
- **Snake_case ↔ camelCase**: API uses snake_case, SDK uses camelCase. Conversion happens in HTTPClient (request encoding / response decoding)
- **Error handling**: All API errors throw typed `MemoryKitError` subclasses with statusCode, code, message
- **Streaming**: SSE parser in `sse.ts` yields typed events (text, sources, usage, done, error)
- **Dual build**: ESM (`dist/esm/`) + CJS (`dist/cjs/`), CJS files renamed to `.cjs` via `scripts/fix-cjs.js`
- **No runtime deps**: Uses only built-in `fetch` API (Node 18+)

## API → SDK Method Mapping

| API Endpoint | SDK Method |
|---|---|
| `POST /v1/memories` | `mk.memories.create()` |
| `GET /v1/memories` | `mk.memories.list()` |
| `GET /v1/memories/:id` | `mk.memories.get()` |
| `PUT /v1/memories/:id` | `mk.memories.update()` |
| `DELETE /v1/memories/:id` | `mk.memories.delete()` |
| `POST /v1/memories/search` | `mk.memories.search()` |
| `POST /v1/memories/query` | `mk.memories.query()` |
| `POST /v1/memories/query/stream` | `mk.memories.stream()` |
| `POST /v1/memories/upload` | `mk.memories.upload()` |
| `POST /v1/memories/:id/reprocess` | `mk.memories.reprocess()` |
| `POST /v1/chats` | `mk.chats.create()` |
| `GET /v1/chats` | `mk.chats.list()` |
| `GET /v1/chats/:id` | `mk.chats.get()` |
| `DELETE /v1/chats/:id` | `mk.chats.delete()` |
| `POST /v1/chats/:id/messages` | `mk.chats.sendMessage()` |
| `POST /v1/chats/:id/messages/stream` | `mk.chats.streamMessage()` |
| `GET /v1/chats/:id/history` | `mk.chats.getHistory()` |
| `POST /v1/users` | `mk.users.upsert()` |
| `GET /v1/users/:id` | `mk.users.get()` |
| `PUT /v1/users/:id` | `mk.users.update()` |
| `DELETE /v1/users/:id` | `mk.users.delete()` |
| `POST /v1/users/:id/events` | `mk.users.createEvent()` |
| `GET /v1/users/:id/events` | `mk.users.listEvents()` |
| `DELETE /v1/users/:id/events/:eid` | `mk.users.deleteEvent()` |
| `POST /v1/webhooks` | `mk.webhooks.create()` |
| `GET /v1/webhooks` | `mk.webhooks.list()` |
| `GET /v1/webhooks/:id` | `mk.webhooks.get()` |
| `DELETE /v1/webhooks/:id` | `mk.webhooks.delete()` |
| `POST /v1/webhooks/:id/test` | `mk.webhooks.test()` |
| `GET /v1/status` | `mk.status.get()` |
| `POST /v1/feedback` | `mk.feedback.submit()` |

## Adding a New Method

1. Add types to `src/types.ts` (request params + response)
2. Add method to the resource file in `src/resources/`
3. Export new types from `src/index.ts` if public
4. Run `npm run build` to verify
5. Update README.md usage examples

## Testing (TODO)

Currently 0% test coverage. Test infrastructure not yet set up.
Planned: vitest + msw for HTTP mocking.
