/**
 * sse-parser.ts — SSE (Server-Sent Events) parser for AI chat responses
 * ──────────────────────────────────────────────────────────────────
 * Reusable, testable parser that handles:
 *   - LF and CRLF line endings
 *   - SSE comments (": keepalive")
 *   - data: [DONE] sentinel
 *   - Split JSON chunks across network boundaries
 *   - Multiple events in a single network chunk
 *   - choices[0].delta.content (streaming)
 *   - choices[0].message.content (non-stream)
 *   - content as array (some providers)
 *   - Reasoning/thinking content filtering
 *   - usage-only final chunks
 *   - finish_reason detection
 *   - Empty delta events
 *   - Malformed JSON without crashing
 * ──────────────────────────────────────────────────────────────────
 */

export type SseEventType = 'delta' | 'done' | 'usage' | 'finish' | 'error' | 'keepalive';

export interface SseEvent {
  type: SseEventType;
  /** Text content (only for 'delta' events) */
  content?: string;
  /** Usage data (tokens_in, tokens_out) */
  usage?: { tokens_in?: number; tokens_out?: number; total_tokens?: number };
  /** finish_reason value */
  finishReason?: string;
}

/**
 * Accumulator for SSE stream parsing across multiple chunks.
 * Feed chunks via feed() and get parsed events via drain().
 */
export class SseParser {
  private buffer = '';
  private events: SseEvent[] = [];
  private _done = false;
  private _hasContent = false;
  private _finishReason = '';

  /** Whether stream has ended ([DONE] received) */
  get done(): boolean {
    return this._done;
  }

  /** Whether any actual text content was received */
  get hasContent(): boolean {
    return this._hasContent;
  }

  /** The finish_reason from the stream, if any */
  get finishReason(): string {
    return this._finishReason;
  }

  /** Feed a chunk of raw SSE text */
  feed(raw: string): void {
    this.buffer += raw;

    // Split on LF or CRLF
    const lines = this.buffer.split(/\r?\n/);
    // Keep the last (possibly incomplete) line in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this._processLine(line);
    }
  }

  /** Signal end of stream — process remaining buffer */
  end(): void {
    if (this.buffer.trim()) {
      this._processLine(this.buffer);
      this.buffer = '';
    }
    this._done = true;
  }

  /** Get and clear accumulated events */
  drain(): SseEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  /** Check if we have pending events */
  hasEvents(): boolean {
    return this.events.length > 0;
  }

  private _processLine(line: string): void {
    const trimmed = line.trim();

    // Empty line — SSE event separator (ignore)
    if (!trimmed) return;

    // SSE comment (keepalive)
    if (trimmed.startsWith(':')) {
      this.events.push({ type: 'keepalive' });
      return;
    }

    // Must start with "data:"
    if (!trimmed.startsWith('data:')) return;

    const payload = trimmed.slice(5).trim();

    // [DONE] sentinel
    if (payload === '[DONE]') {
      this._done = true;
      this.events.push({ type: 'done' });
      return;
    }

    // Try to parse JSON
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(payload);
    } catch {
      // Malformed JSON — skip silently
      return;
    }

    // Extract content from various response shapes
    const content = this._extractContent(json);

    // Check for finish_reason
    const choices = json?.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const choice = choices[0];
      if (choice && typeof choice === 'object') {
        const fr = (choice as Record<string, unknown>)?.finish_reason;
        if (typeof fr === 'string' && fr) {
          this._finishReason = fr;
          this.events.push({ type: 'finish', finishReason: fr });
        }
      }
    }

    // Check for usage data (often in final chunk)
    const usage = json?.usage;
    if (usage && typeof usage === 'object') {
      const u = usage as Record<string, unknown>;
      this.events.push({
        type: 'usage',
        usage: {
          tokens_in:
            typeof u.prompt_tokens === 'number'
              ? u.prompt_tokens
              : typeof u.tokens_in === 'number'
                ? u.tokens_in
                : undefined,
          tokens_out:
            typeof u.completion_tokens === 'number'
              ? u.completion_tokens
              : typeof u.tokens_out === 'number'
                ? u.tokens_out
                : undefined,
          total_tokens: typeof u.total_tokens === 'number' ? u.total_tokens : undefined,
        },
      });
    }

    // Emit content delta if we have text
    if (content) {
      this._hasContent = true;
      this.events.push({ type: 'delta', content });
    }
  }

  /**
   * Extract text content from various provider response shapes.
   * Filters out reasoning/thinking content.
   */
  private _extractContent(json: Record<string, unknown>): string {
    const choices = json?.choices;
    if (!Array.isArray(choices) || choices.length === 0) return '';

    const choice = choices[0];
    if (!choice || typeof choice !== 'object') return '';

    const c = choice as Record<string, unknown>;

    // Streaming: choices[0].delta.content
    const delta = c.delta;
    if (delta && typeof delta === 'object') {
      const d = delta as Record<string, unknown>;

      // Skip reasoning/thinking content
      const reasoningContent = d.reasoning_content || d.reasoning || d.thinking;
      if (typeof reasoningContent === 'string' && reasoningContent) {
        // Has reasoning but might also have regular content
        const regularContent = d.content;
        if (typeof regularContent === 'string' && regularContent) {
          return regularContent;
        }
        return ''; // Only reasoning, filter it out
      }

      return this._normalizeContent(d.content);
    }

    // Non-stream: choices[0].message.content
    const message = c.message;
    if (message && typeof message === 'object') {
      const m = message as Record<string, unknown>;

      // Skip reasoning/thinking content
      const reasoningContent = m.reasoning_content || m.reasoning || m.thinking;
      if (typeof reasoningContent === 'string' && reasoningContent) {
        const regularContent = m.content;
        if (typeof regularContent === 'string' && regularContent) {
          return regularContent;
        }
        return '';
      }

      return this._normalizeContent(m.content);
    }

    return '';
  }

  /**
   * Normalize content value to string.
   * Some providers return content as an array of objects.
   */
  private _normalizeContent(value: unknown): string {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      // Handle content arrays like [{type: "text", text: "..."}]
      return value
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>;
            return String(obj.text || obj.content || '');
          }
          return '';
        })
        .filter(Boolean)
        .join('');
    }
    return '';
  }
}

/**
 * Convenience function: parse a full response body (non-stream) and extract text.
 */
export function extractNonStreamContent(data: unknown): {
  text: string;
  usage?: SseEvent['usage'];
  finishReason?: string;
} {
  if (!data || typeof data !== 'object') return { text: '' };

  const obj = data as Record<string, unknown>;
  const choices = obj.choices;

  let text = '';
  let finishReason = '';

  if (Array.isArray(choices) && choices.length > 0) {
    const choice = choices[0] as Record<string, unknown>;
    if (choice) {
      // message.content
      const message = choice.message;
      if (message && typeof message === 'object') {
        const m = message as Record<string, unknown>;
        // Filter reasoning
        const reasoning = m.reasoning_content || m.reasoning || m.thinking;
        if (typeof reasoning === 'string' && reasoning) {
          const regular = m.content;
          if (typeof regular === 'string' && regular) {
            text = regular;
          }
        } else {
          const parser = new SseParser();
          // Reuse normalization
          text = (parser as any)._normalizeContent(m.content) || '';
        }
      }

      // Also check for finish_reason
      if (typeof choice.finish_reason === 'string') {
        finishReason = choice.finish_reason;
      }
    }
  }

  let usage: SseEvent['usage'];
  const u = obj.usage;
  if (u && typeof u === 'object') {
    const ur = u as Record<string, unknown>;
    usage = {
      tokens_in:
        typeof ur.prompt_tokens === 'number'
          ? ur.prompt_tokens
          : typeof ur.tokens_in === 'number'
            ? ur.tokens_in
            : undefined,
      tokens_out:
        typeof ur.completion_tokens === 'number'
          ? ur.completion_tokens
          : typeof ur.tokens_out === 'number'
            ? ur.tokens_out
            : undefined,
      total_tokens: typeof ur.total_tokens === 'number' ? ur.total_tokens : undefined,
    };
  }

  return { text, usage, finishReason };
}
