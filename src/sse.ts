import type { StreamEvent } from './types.js';

/**
 * Parse SSE lines from a `ReadableStream<Uint8Array>` and yield
 * strongly-typed `StreamEvent` objects.
 *
 * The parser handles:
 *  - Multi-byte UTF-8 across chunk boundaries
 *  - `data:` fields spanning multiple lines (joined with `\n`)
 *  - `event:` field overrides (falls back to "text")
 *  - Empty lines that signal event dispatch
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>,
): AsyncIterable<StreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';
  let currentEvent = '';
  let currentData = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        // Blank line = dispatch current event
        if (line.trim() === '') {
          if (currentData) {
            const eventType = currentEvent || 'text';
            const parsed = tryParseJSON(currentData);

            yield makeStreamEvent(eventType, parsed);
          }
          currentEvent = '';
          currentData = '';
          continue;
        }

        if (line.startsWith(':')) {
          // SSE comment — ignore
          continue;
        }

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const field = line.slice(0, colonIndex);
        // Skip the optional single space after the colon
        const value_ = line[colonIndex + 1] === ' '
          ? line.slice(colonIndex + 2)
          : line.slice(colonIndex + 1);

        switch (field) {
          case 'event':
            currentEvent = value_;
            break;
          case 'data':
            currentData += (currentData ? '\n' : '') + value_;
            break;
          // id / retry fields ignored for now
        }
      }
    }

    // Flush any remaining data
    if (currentData) {
      const eventType = currentEvent || 'text';
      const parsed = tryParseJSON(currentData);
      yield makeStreamEvent(eventType, parsed);
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tryParseJSON(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // If the data isn't JSON, wrap it as a text content event
    return { content: raw };
  }
}

function makeStreamEvent(eventType: string, data: unknown): StreamEvent {
  switch (eventType) {
    case 'text':
      return { event: 'text', data: data as StreamEvent extends { event: 'text' } ? StreamEvent['data'] : never } as StreamEvent;
    case 'sources':
      return { event: 'sources', data } as StreamEvent;
    case 'usage':
      return { event: 'usage', data } as StreamEvent;
    case 'done':
      return { event: 'done', data: {} } as StreamEvent;
    case 'error':
      return { event: 'error', data } as StreamEvent;
    default:
      // Treat unknown event types as text
      return { event: 'text', data } as StreamEvent;
  }
}
