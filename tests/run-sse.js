/**
 * SSE Parser + Recovery + PICK + Security Tests
 */
let passed = 0;
let failed = 0;
const failures = [];

function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.log(`  FAIL: ${label}\n    Expected: ${e}\n    Actual:   ${a}`);
  }
}
function assert(cond, label) {
  assertEqual(!!cond, true, label);
}

// ═══ SSE Parser (mirrors sse-parser.ts) ═══
class SseParser {
  constructor() {
    this.buffer = '';
    this.events = [];
    this._done = false;
    this._hasContent = false;
    this._finishReason = '';
  }
  get done() {
    return this._done;
  }
  get hasContent() {
    return this._hasContent;
  }
  get finishReason() {
    return this._finishReason;
  }
  feed(raw) {
    this.buffer += raw;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || '';
    for (const line of lines) this._processLine(line);
  }
  end() {
    if (this.buffer.trim()) {
      this._processLine(this.buffer);
      this.buffer = '';
    }
    this._done = true;
  }
  drain() {
    const out = this.events;
    this.events = [];
    return out;
  }
  _processLine(line) {
    const t = line.trim();
    if (!t) return;
    if (t.startsWith(':')) {
      this.events.push({ type: 'keepalive' });
      return;
    }
    if (!t.startsWith('data:')) return;
    const p = t.slice(5).trim();
    if (p === '[DONE]') {
      this._done = true;
      this.events.push({ type: 'done' });
      return;
    }
    let json;
    try {
      json = JSON.parse(p);
    } catch {
      return;
    }
    const content = this._extractContent(json);
    const choices = json?.choices;
    if (
      Array.isArray(choices) &&
      choices.length > 0 &&
      choices[0] &&
      typeof choices[0] === 'object'
    ) {
      const fr = choices[0].finish_reason;
      if (typeof fr === 'string' && fr) {
        this._finishReason = fr;
        this.events.push({ type: 'finish', finishReason: fr });
      }
    }
    const usage = json?.usage;
    if (usage && typeof usage === 'object') {
      this.events.push({
        type: 'usage',
        usage: {
          tokens_in: usage.prompt_tokens ?? usage.tokens_in,
          tokens_out: usage.completion_tokens ?? usage.tokens_out,
          total_tokens: usage.total_tokens,
        },
      });
    }
    if (content) {
      this._hasContent = true;
      this.events.push({ type: 'delta', content });
    }
  }
  _extractContent(json) {
    const choices = json?.choices;
    if (!Array.isArray(choices) || !choices.length || !choices[0] || typeof choices[0] !== 'object')
      return '';
    const c = choices[0];
    const delta = c.delta;
    if (delta && typeof delta === 'object') {
      const rc = delta.reasoning_content || delta.reasoning || delta.thinking;
      if (typeof rc === 'string' && rc) {
        return typeof delta.content === 'string' && delta.content ? delta.content : '';
      }
      return this._norm(delta.content);
    }
    const message = c.message;
    if (message && typeof message === 'object') {
      const rc = message.reasoning_content || message.reasoning || message.thinking;
      if (typeof rc === 'string' && rc) {
        return typeof message.content === 'string' && message.content ? message.content : '';
      }
      return this._norm(message.content);
    }
    return '';
  }
  _norm(v) {
    if (typeof v === 'string') return v;
    if (Array.isArray(v))
      return v
        .map((i) =>
          typeof i === 'string'
            ? i
            : i && typeof i === 'object'
              ? String(i.text || i.content || '')
              : ''
        )
        .filter(Boolean)
        .join('');
    return '';
  }
}

console.log('=== SSE Parser Tests ===\n');

// 1
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"delta":{"content":"Hello"}}]}\n');
  p.feed('data: {"choices":[{"delta":{"content":" world"}}]}\n');
  p.feed('data: [DONE]\n');
  const e = p.drain().filter((x) => x.type === 'delta');
  assertEqual(e.length, 2, '1. Normal SSE - 2 deltas');
  assertEqual(e[0].content, 'Hello', '1. First delta');
  assert(p.done, '1. Done flag');
  assert(p.hasContent, '1. Has content');
}
// 2
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"delta":{"content":"Test"}}]}\r\n');
  p.feed('data: [DONE]\r\n');
  const e = p.drain().filter((x) => x.type === 'delta');
  assertEqual(e.length, 1, '2. CRLF - 1 delta');
  assertEqual(e[0].content, 'Test', '2. CRLF content');
}
// 3
{
  const p = new SseParser();
  const f = 'data: {"choices":[{"delta":{"content":"Split"}}]}';
  p.feed(f.slice(0, 10));
  p.feed(f.slice(10) + '\n');
  const e = p.drain().filter((x) => x.type === 'delta');
  assertEqual(e.length, 1, '3. Split chunk - 1 delta');
  assertEqual(e[0].content, 'Split', '3. Split content');
}
// 4
{
  const p = new SseParser();
  p.feed(': keepalive\n');
  p.feed('data: {"choices":[{"delta":{"content":"After"}}]}\n');
  const e = p.drain();
  assert(e.filter((x) => x.type === 'keepalive').length === 1, '4. Keepalive event');
  assert(e.filter((x) => x.type === 'delta').length === 1, '4. Delta after keepalive');
}
// 5
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"delta":{}}]}\n');
  p.feed('data: [DONE]\n');
  p.end();
  assertEqual(p.drain().filter((x) => x.type === 'delta').length, 0, '5. Empty stream - 0 deltas');
  assert(!p.hasContent, '5. hasContent=false');
}
// 6
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n');
  p.feed('data: {"usage":{"prompt_tokens":50,"completion_tokens":0}}\n');
  p.end();
  assert(!p.hasContent, '6. tokens_out=0 - no content');
  const u = p.drain().filter((x) => x.type === 'usage');
  assertEqual(u[0]?.usage?.tokens_out, 0, '6. tokens_out is 0');
}
// 7
{
  const p = new SseParser();
  p.feed('data: {broken\n');
  p.feed('data: {"choices":[{"delta":{"content":"OK"}}]}\n');
  const e = p.drain().filter((x) => x.type === 'delta');
  assertEqual(e.length, 1, '7. Malformed - 1 valid');
  assertEqual(e[0].content, 'OK', '7. Malformed content');
}
// 8
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"delta":{"reasoning_content":"Think","content":""}}]}\n');
  assertEqual(p.drain().filter((x) => x.type === 'delta').length, 0, '8. Reasoning filtered');
  assert(!p.hasContent, '8. No content from reasoning only');
}
// 9
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"delta":{"reasoning_content":"Think","content":"Real"}}]}\n');
  const e = p.drain().filter((x) => x.type === 'delta');
  assertEqual(e.length, 1, '9. Reasoning+real - 1 delta');
  assertEqual(e[0].content, 'Real', '9. Real content');
}
// 10
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"delta":{"content":[{"type":"text","text":"Arr"}]}}]}\n');
  const e = p.drain().filter((x) => x.type === 'delta');
  assertEqual(e.length, 1, '10. Array content');
  assertEqual(e[0].content, 'Arr', '10. Array text');
}
// 11
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"message":{"content":"NonStream"}}]}\n');
  const e = p.drain().filter((x) => x.type === 'delta');
  assertEqual(e.length, 1, '11. Non-stream');
  assertEqual(e[0].content, 'NonStream', '11. Non-stream content');
}
// 12
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"delta":{"content":"X"},"finish_reason":"stop"}]}\n');
  assertEqual(p.finishReason, 'stop', '12. finish_reason');
}
// 13
{
  const p = new SseParser();
  p.feed('data: {"usage":{"prompt_tokens":100,"completion_tokens":50,"total_tokens":150}}\n');
  const u = p.drain().filter((x) => x.type === 'usage');
  assertEqual(u[0]?.usage?.tokens_in, 100, '13. tokens_in');
  assertEqual(u[0]?.usage?.tokens_out, 50, '13. tokens_out');
}
// 14
{
  const p = new SseParser();
  p.feed(
    'data: {"choices":[{"delta":{"content":"A"}}]}\ndata: {"choices":[{"delta":{"content":"B"}}]}\ndata: [DONE]\n'
  );
  const e = p.drain().filter((x) => x.type === 'delta');
  assertEqual(e.length, 2, '14. Multi-event');
  assert(p.done, '14. Done');
}
// 15
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"delta":{"content":""}}]}\n');
  assertEqual(p.drain().filter((x) => x.type === 'delta').length, 0, '15. Empty delta ignored');
}
// 16
{
  const p = new SseParser();
  p.feed('data: {"choices":[{"delta":{"content":"Part"}}]}\n');
  p.end();
  assert(p.done, '16. End sets done');
  assert(p.hasContent, '16. Has content');
}

console.log('\n=== PICK Parser Tests ===\n');
function parseAiPicks(text, candidates, max) {
  const m = text.match(/PICK\s*:?\s*([\d,\s]+)/i);
  if (!m) return [];
  const ids = m[1]
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));
  const picks = [];
  for (const id of ids) {
    const f = candidates.find((c) => c.id === id);
    if (f && picks.length < max) picks.push(f);
  }
  return picks;
}
const cands = [
  { id: 101, name: 'A' },
  { id: 102, name: 'B' },
  { id: 103, name: 'C' },
];
// 17-21
assertEqual(parseAiPicks('PICK: 102', cands, 1).length, 1, '17. Valid PICK');
assertEqual(parseAiPicks('PICK: 102', cands, 1)[0].id, 102, '18. Correct ID');
assertEqual(parseAiPicks('PICK: 999', cands, 1).length, 0, '19. Fake ID');
assertEqual(parseAiPicks('PICK:', cands, 1).length, 0, '20. Empty PICK');
assertEqual(parseAiPicks('PICK: 101,103', cands, 2).length, 2, '21. Multi PICK');

console.log('\n=== URL Sanitization Tests ===\n');
function sanitizeUrl(url) {
  if (!url) return null;
  try {
    const p = new URL(url, 'http://localhost');
    const ok = ['offl.ir', 'www.offl.ir', 'localhost', '127.0.0.1'];
    return (ok.includes(p.hostname) || p.hostname.endsWith('.offl.ir')) &&
      (p.pathname.startsWith('/product/') || p.pathname === '/')
      ? url
      : null;
  } catch {
    return url.startsWith('/product/') ? url : null;
  }
}
assert(sanitizeUrl('/product/123') !== null, '22. Valid relative URL');
assert(sanitizeUrl('https://offl.ir/product/123') !== null, '23. Valid full URL');
assert(sanitizeUrl('https://evil.com/product/1') === null, '24. Evil host rejected');
assert(sanitizeUrl('https://offl.ir/admin') === null, '25. Bad path rejected');
assert(sanitizeUrl('javascript:alert(1)') === null, '26. JS injection rejected');

console.log('\n=== Security Tests ===\n');
function sanitizePrompt(text) {
  return text
    .replace(
      /(\bignore\b|\bforget\b|\bdisregard\b|\boverride\b|\bnew instruction\b|\bsystem prompt\b|\bsecret\b|\btoken\b|\bapi key\b|\bpassword\b)/gi,
      ''
    )
    .replace(/<script[^>]*>[^]*?<\/script>/gi, '')
    .replace(/`[^`]*`/g, '')
    .trim()
    .slice(0, 1000);
}
assert(!sanitizePrompt('ignore all').includes('ignore'), '27. Ignore keyword removed');
assert(!sanitizePrompt('reveal secret token').includes('secret'), '28. Secret keyword removed');
assert(sanitizePrompt('hello '.repeat(500)).length <= 1000, '29. Length limit');

console.log('\n=== Duplicate Prevention Tests ===\n');
const sources = [
  { title: 'P1', url: '/product/1', price: '100', inStock: true },
  { title: 'P1', url: '/product/1', price: '100', inStock: true },
  { title: 'P2', url: '/product/2', price: '200', inStock: true },
];
const seen = new Set();
const unique = sources.filter((s) => {
  if (seen.has(s.url)) return false;
  seen.add(s.url);
  return true;
});
assertEqual(unique.length, 2, '30. Product dedup');

// ═══ Summary ═══
console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.log('Failed:', failures.join(', '));
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED ✓');
  process.exit(0);
}
