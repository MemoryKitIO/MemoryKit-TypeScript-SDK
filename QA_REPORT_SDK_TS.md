# QA Report: MemoryKit TypeScript SDK v0.1.1

**Date:** 2026-02-26
**Scope:** `memorykit` npm package (SDKs/MemoryKit-TypeScript-SDK)
**Baseline:** Backend public API (`Backend/presentation/api/public/`)

---

## 1. Build Status

| Check          | Result | Notes                                  |
|----------------|--------|----------------------------------------|
| `npm install`  | PASS   | 0 vulnerabilities, 43 packages         |
| `npm run build`| PASS   | ESM + CJS, 48 CJS files renamed        |
| `npm run typecheck` | PASS | `tsc --noEmit` clean                |
| ESM output     | PASS   | `dist/esm/` — .js + .d.ts + .map      |
| CJS output     | PASS   | `dist/cjs/` — .cjs + .d.cts + .map    |
| Zero deps      | PASS   | No runtime dependencies                |

---

## 2. API Contract Mismatches

### 2.1 Missing SDK Methods / Endpoints

| Backend Endpoint | HTTP | Status | SDK Method | Issue |
|---|---|---|---|---|
| `GET /v1/chats/{id}` | GET | 200 | **MISSING** | No `chats.get(id)` method. Documented in CLAUDE.md but not implemented. |

### 2.2 Streaming Protocol Mismatch (CRITICAL)

**Severity: HIGH**

The Backend and SDK use incompatible SSE protocols:

**Backend sends:**
```
data: {"type": "text", "content": "chunk..."}

data: {"type": "done", "request_id": "...", "mode": "balanced"}

data: {"type": "error", "message": "..."}
```

**SDK SSE parser expects:**
```
event: text
data: {"content": "chunk..."}

event: done
data: {}

event: sources
data: {"sources": [...]}
```

**Impact:**
- The Backend does NOT emit `event:` SSE field lines. It embeds the event type as `type` inside the JSON `data:` payload.
- The SDK parser (`sse.ts`) falls back to `event: 'text'` when no `event:` line is present, so all events (including `done` and `error`) would be classified as `text` events.
- The parser would try to parse `{"type": "done", "request_id": "..."}` as a text event, producing `{ event: 'text', data: { type: 'done', request_id: '...', mode: 'balanced' } }` instead of the expected `{ event: 'done', data: {} }`.
- The `sources` and `usage` events are never emitted by the Backend in either streaming endpoint (memories query or chat messages).

**SDK stream method also uses wrong path:**
- SDK `memories.stream()` sends `POST /v1/memories/query` with `{ stream: true }` in body
- Backend uses the same `/v1/memories/query` endpoint with `stream` body param, which is correct for the path
- But the SDK adds `Accept: text/event-stream` header while sending `stream: true` in body -- the Backend dispatches on `body.stream`, not the Accept header, so this works but the header is unnecessary

### 2.3 Response Shape Mismatches

| Resource | SDK Type | Backend Response | Mismatch |
|---|---|---|---|
| `webhooks.list()` | Returns `Webhook[]` | Returns `{ data: WebhookResponse[] }` | SDK expects flat array, Backend wraps in `{ data }`. Deserialized result will be `{ data: [...] }` cast to `Webhook[]`, breaking the type contract. |
| `webhooks.test()` | `WebhookTestResult { success, statusCode }` | `{ success, status_code }` OR `{ success: false, error: str }` | SDK does not model the `error` field returned on failure. |
| `SearchResult` | Has `title` field | Backend returns `memory_title` | After snake-to-camel conversion becomes `memoryTitle`, not `title`. SDK type is wrong. |
| `SearchResult` | Has `type` field | Backend `SearchResultItem` has no `type` | SDK expects a field the Backend never sends. Always `undefined`. |
| `QuerySource` | Has `title` field | Backend returns `memory_title` | After conversion becomes `memoryTitle`, not `title`. SDK type is wrong. |
| `QuerySource` | Missing `tags` field | Backend `SourceItem` includes `tags: List[str]` | SDK drops tags data from query sources. |
| `Feedback` | Has `comment: string \| null` | Backend `FeedbackResponse` has no `comment` | SDK expects a field that Backend never returns. |
| `SearchResponse` | Missing `processingTimeMs` | Backend returns `processing_time_ms` | SDK type is missing this field (data is received but not typed). |
| `ProjectStatus` | Fixed `knowledge` shape with `totalChunks`, `totalEntities`, etc. | Backend returns dynamic shape: `analyzed_documents`, `top_tags`, `languages`, `context_types`, `documents` | SDK `knowledge` type definition is entirely wrong — models fields that don't exist in Backend response. |

### 2.4 Missing SDK Parameters

| Endpoint | Backend Param | SDK Param | Issue |
|---|---|---|---|
| `POST /v1/memories/query` | `score_threshold` | **MISSING** | SDK `QueryParams` does not expose `scoreThreshold` for queries. |
| `POST /v1/users/{id}/events` | `timestamp` | **MISSING** | SDK `CreateEventParams` does not expose `timestamp` field. |
| `POST /v1/memories` | `format` accepts `"json"` | SDK `MemoryFormat` only has `text \| markdown \| html` | Missing `json` format option (though `string` union fallback covers it). |
| `POST /v1/chats/{id}/messages` | `user_id` (not in Backend `SendMessageRequest`) | SDK has `userId` in `SendMessageParams` | Backend `SendMessageRequest` does not accept `user_id` — it uses the chat's associated user. SDK param has no effect. |

### 2.5 Missing Backend Endpoints in SDK

| Backend Endpoint | Description | SDK Coverage |
|---|---|---|
| Events SSE (`/v1/events`) | Backend has `events.py` router | No SDK resource for server-sent events endpoint |

Let me verify this:

The `events.py` in the Backend public API is for **User Events** (`/v1/users/{id}/events`), which IS covered by the SDK via `users.createEvent()`, `users.listEvents()`, `users.deleteEvent()`. The router is just mounted separately. **No gap here.**

---

## 3. Type Safety Issues

### 3.1 Field Name Mismatches (after camelCase conversion)

| SDK Type | SDK Field | Backend Field (snake_case) | camelCase Result | Match? |
|---|---|---|---|---|
| `QuerySource` | `title` | `memory_title` | `memoryTitle` | NO |
| `SearchResult` | `title` | `memory_title` | `memoryTitle` | NO |
| `SearchResult` | `memoryId` | `memory_id` | `memoryId` | YES |
| `Chat` | `messageCount` | `message_count` | `messageCount` | YES |

### 3.2 Incorrect Type Definitions

| SDK Type | Issue |
|---|---|
| `ProjectStatus.knowledge` | SDK defines: `{ totalChunks, totalEntities, totalRelationships, embeddingDimensions }`. Backend returns: `{ analyzed_documents, top_tags, languages, context_types, documents }`. Completely different structure. |
| `SearchResult.type` | Field does not exist in Backend response. Will always be `undefined`. |
| `Feedback.comment` | Field does not exist in Backend response. Will always be `undefined`. |
| `QueryResponse.usage` | SDK types it as required `QueryUsage`. Backend types it as `Optional[QueryUsage]`. Could be `null`. |
| `BatchMemoryResult.title` | SDK types as `string` (required). Backend types as `Optional[str]`. Could be `null`. |

### 3.3 Enum/Union Gaps

| Type | SDK Values | Backend Values | Gap |
|---|---|---|---|
| `MemoryFormat` | `text \| markdown \| html \| string` | `text \| markdown \| json \| html` | SDK omits `json` in named union (covered by `string` fallback) |
| `ModelName` | `gpt-5-nano \| gpt-5-mini \| gpt-5-nano \| gpt-5-nano \| string` | `gpt-5-nano \| gpt-5-mini \| gpt-5-nano \| gpt-5-nano` | Match (Backend restricts via regex) |
| `QueryMode` | `fast \| balanced \| precise \| string` | `fast \| balanced \| precise` | Match (Backend restricts via regex) |

### 3.4 PaginatedList Missing Total Count

The Backend's `EventListResponse` returns `{ data, has_more }`. The SDK's `PaginatedList<T>` also returns `{ data, hasMore }`. These match. However, no endpoints return a `total` count, and the SDK doesn't try to expose one, which is correct.

---

## 4. Error Handling Audit

### 4.1 Error Class Mapping

| HTTP Status | SDK Error Class | Correct? |
|---|---|---|
| 400 | `ValidationError` | YES |
| 401 | `AuthenticationError` | YES |
| 403 | `PermissionError` | YES |
| 404 | `NotFoundError` | YES |
| 422 | `ValidationError` | YES |
| 429 | `RateLimitError` | YES |
| 500+ | `ServerError` | YES |
| Other 4xx | `MemoryKitError` | YES (generic fallback) |

### 4.2 Error Parsing

| Check | Status | Notes |
|---|---|---|
| Reads `detail` from response body | PASS | FastAPI default error field |
| Falls back to `message`, `error` | PASS | |
| Reads `x-request-id` header | PASS | |
| Reads `code` from body | PASS | |
| Parses `Retry-After` header for 429 | PASS | |
| Handles non-JSON error responses | PASS | try/catch around res.json() |

### 4.3 Retry Logic

| Check | Status | Notes |
|---|---|---|
| Retries on 429 | PASS | |
| Retries on 500, 502, 503, 504 | PASS | |
| Does NOT retry on 400, 401, 403, 404, 422 | PASS | |
| Exponential backoff with jitter | PASS | base * 2^attempt + random jitter |
| Respects Retry-After header | PASS | Overrides calculated backoff |
| Max retries configurable | PASS | Default: 3 |
| Timeout per request | PASS | Default: 30s, configurable |
| AbortController for timeout | PASS | |
| Network error handling (TypeError) | PASS | |

### 4.4 Error Handling Gaps

| Issue | Severity | Description |
|---|---|---|
| No `BadRequestError` subclass | LOW | 400 and 422 both map to `ValidationError`. Some SDKs differentiate these. Currently acceptable. |
| Timeout error loses context | LOW | `MemoryKitError` with `statusCode: undefined` — could benefit from a `TimeoutError` subclass. |
| `202 Accepted` treated as success in retry loop | PASS | Correct — line 147 checks `res.ok || res.status === 202`. |

---

## 5. DX (Developer Experience) Issues

### 5.1 README Accuracy

| Section | Issue | Severity |
|---|---|---|
| User delete example | Shows `mk.users.delete("user_123", { cascade: true })` but SDK method signature is `delete(id: string): Promise<void>` — no options param, Backend doesn't support cascade either | MEDIUM |
| Search example | Shows `result.title` but actual field after camelCase conversion would be `result.memoryTitle` | MEDIUM |
| Streaming events | README shows `sources` and `usage` events but Backend never emits these in streaming | HIGH |

### 5.2 Package Exports

| Check | Status | Notes |
|---|---|---|
| ESM entry point | PASS | `dist/esm/index.js` |
| CJS entry point | PASS | `dist/cjs/index.cjs` |
| Type declarations | PASS | `.d.ts` and `.d.cts` |
| Conditional exports | PASS | `import` / `require` properly configured |
| `sideEffects: false` | PASS | Enables tree-shaking |
| `engines.node >= 18` | PASS | Required for native `fetch` |

### 5.3 Other DX Issues

| Issue | Severity | Description |
|---|---|---|
| No `ctx_` prefix validation | LOW | `apiKey` docstring says "starting with `ctx_`" but constructor never validates the prefix. Invalid keys silently produce 401 errors. |
| No test coverage | HIGH | 4 test files exist (client, errors, exports, case-conversion) but no resource-level tests. 0% integration coverage. |
| SDK_VERSION hardcoded | LOW | `SDK_VERSION = '0.1.1'` in `client.ts` must be manually synced with `package.json`. |
| `snakeToCamel` exported but undocumented | LOW | `utils.ts` exports `camelToSnake` and `snakeToCamel` but these are internal utilities. |
| `Content-Type: application/json` sent on GET requests | LOW | GET requests with no body still send `Content-Type: application/json`. Not harmful but technically incorrect. |
| SSE parser ignores `id` and `retry` fields | LOW | Standard SSE fields `id:` and `retry:` are ignored. Low impact for current use case. |
| `toCamelCase` applied to entire response | MEDIUM | Converts ALL response keys recursively, including user-controlled `metadata` object keys. If a user stores `my_key: "value"` in metadata, it will be returned as `myKey: "value"`. |

---

## 6. Summary of Issues by Severity

### CRITICAL (Blocks correct usage)

1. **SSE Streaming Protocol Mismatch** — Backend uses `type` field in JSON data payload; SDK parser expects `event:` SSE field lines. All streaming events misclassified. Streaming is fundamentally broken.

2. **`webhooks.list()` Return Type Mismatch** — Backend returns `{ data: [...] }`, SDK types return as `Webhook[]`. Consumers accessing `.id` or `.url` on the result will get `undefined`.

### HIGH (Incorrect data or missing functionality)

3. **`QuerySource.title` / `SearchResult.title` field name wrong** — Backend returns `memory_title` (becomes `memoryTitle`), SDK types it as `title`. Consumers reading `.title` get `undefined`.

4. **`QuerySource` missing `tags` field** — Backend returns tags per source; SDK drops them silently.

5. **`ProjectStatus.knowledge` type entirely wrong** — SDK models fields (`totalChunks`, `totalEntities`, etc.) that don't exist. Actual Backend fields (`analyzed_documents`, `top_tags`, etc.) are untyped.

6. **`chats.get(id)` method missing** — Documented in CLAUDE.md but not implemented.

7. **`SearchResult.type` phantom field** — SDK defines it but Backend never returns it. Always `undefined`.

8. **`metadata` key mutation** — `toCamelCase` recursively converts user metadata keys from `snake_case` to `camelCase`, corrupting user data. Similarly `toSnakeCase` converts camelCase metadata keys to snake_case on the way out.

### MEDIUM (Incorrect docs or minor data loss)

9. **README `users.delete` shows nonexistent `{ cascade: true }` option**

10. **README search example uses wrong field name** (`result.title` vs `result.memoryTitle`)

11. **README streaming example shows events Backend never sends** (`sources`, `usage`)

12. **Missing `scoreThreshold` param on `QueryParams`**

13. **Missing `timestamp` param on `CreateEventParams`**

14. **`Feedback.comment` field in SDK type but not in Backend response**

15. **`SearchResponse` missing `processingTimeMs` field in SDK type**

### LOW (Polish / best practices)

16. No `ctx_` prefix validation on API key
17. No `chats.get()` method (minor — can use getHistory)
18. `Content-Type: application/json` on GET requests
19. SDK_VERSION manually synced
20. 0% resource-level test coverage

---

## 7. Recommendations

### Immediate Fixes (before next release)

1. **Fix SSE parser** to read `type` from JSON data payload instead of relying on `event:` SSE field. Or update Backend to emit proper `event:` lines. Either way, SDK and Backend must agree.

2. **Fix `webhooks.list()`** return type to `PaginatedList<Webhook>` or unwrap the `data` field.

3. **Fix `QuerySource` and `SearchResult`** field names: rename `title` to `memoryTitle`, add `tags` to `QuerySource`, remove `type` from `SearchResult`.

4. **Fix `ProjectStatus.knowledge`** type to match actual Backend response shape.

5. **Add `chats.get(id)`** method — simple `GET /v1/chats/{id}`.

6. **Stop converting metadata keys** — skip `toCamelCase`/`toSnakeCase` for `metadata` field values (only convert top-level API keys, not user data inside `metadata`).

### Short-term (next sprint)

7. Add `scoreThreshold` to `QueryParams`.
8. Add `timestamp` to `CreateEventParams`.
9. Fix README examples (cascade, field names, streaming events).
10. Add `processingTimeMs` to `SearchResponse` type.
11. Remove `comment` from `Feedback` type (or add it to Backend).
12. Add `ctx_` prefix validation with a descriptive error message.

### Medium-term

13. Set up vitest + msw test infrastructure for all resources.
14. Add integration tests against a mock server matching Backend schemas.
15. Auto-generate types from Backend OpenAPI spec to prevent future drift.
16. Consider a `--dry-run` mode or request logger for debugging.

---

*Report generated by QA audit against Backend commit at 2026-02-26.*
