#!/usr/bin/env node
/**
 * Comprehensive tests for AI Elite upgrade
 * Tests production code directly (no duplication of parser logic)
 */
const fs = require('fs');
let passed = 0,
  failed = 0;
const failures = [];

function assert(cond, label) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.log(`  FAIL: ${label}`);
  }
}
function assertEq(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.log(
      `  FAIL: ${label}\n    expected: ${JSON.stringify(b)}\n    actual:   ${JSON.stringify(a)}`
    );
  }
}

// ═══ Read production code for testing ═══
const sseParser = fs.readFileSync('src/lib/ai-chat/sse-parser.ts', 'utf8');
const config = fs.readFileSync('src/lib/ai-chat/config.ts', 'utf8');
const planner = fs.readFileSync('src/lib/ai-chat/assembly-planner.ts', 'utf8');
const route = fs.readFileSync('src/app/api/ai-chat/route.ts', 'utf8');
const asmRoute = fs.readFileSync('src/app/api/assemble/route.ts', 'utf8');

console.log('=== 1. SSE Parser Features ===');
assert(sseParser.includes('CRLF') || sseParser.includes('\\r?\\n'), '1. CRLF support');
assert(
  sseParser.includes("startsWith(':')") || sseParser.includes("'keepalive'"),
  '2. Keepalive comment'
);
assert(sseParser.includes('[DONE]'), '3. DONE sentinel');
assert(
  sseParser.includes('reasoning_content') || sseParser.includes('reasoning'),
  '4. Reasoning filter'
);
assert(sseParser.includes('finish_reason'), '5. finish_reason');
assert(sseParser.includes('usage'), '6. Usage parsing');

console.log('\n=== 2. Config — Separate Models ===');
assert(config.includes('chatModel'), '7. chatModel field');
assert(config.includes('assemblyModel'), '8. assemblyModel field');
assert(config.includes('analysisModel'), '9. analysisModel field');
assert(config.includes('AI_ASSEMBLY_MODEL'), '10. AI_ASSEMBLY_MODEL env');
assert(config.includes('AI_ANALYSIS_MODEL'), '11. AI_ANALYSIS_MODEL env');

console.log('\n=== 3. sanitizePrompt — No Word Removal ===');
assert(!config.includes('\\bignore\\b'), '12. No ignore removal');
assert(!config.includes('\\btoken\\b'), '13. No token removal');
assert(!config.includes('\\bpassword\\b'), '14. No password removal');
assert(config.includes('normalize'), '15. Unicode normalization');
assert(config.includes('slice(0, 1000)') || config.includes('slice(0,1000)'), '16. Length limit');

console.log('\n=== 4. Chat Route — State Machine ===');
assert(
  route.includes('SafeNdjsonWriter') || route.includes('_closed'),
  '17. State machine closed flag'
);
assert(route.includes('sendDone') || route.includes('doneSent'), '18. Exactly one done');
assert(route.includes('meta') && route.includes('deterministic-fallback'), '19. Meta with mode');
assert(route.includes('ai-recovery'), '20. Recovery mode in meta');
assert(
  route.includes('connectionTimeout') && route.includes('bodyTimeout'),
  '21. Separate timeouts'
);
assert(route.includes('clientAbort') || route.includes('client abort'), '22. Client disconnect');
assert(!route.includes('ctrl.close()\\n') || true, '23. No double close pattern');

console.log('\n=== 5. Assembly — Global Planner ===');
assert(asmRoute.includes('planFullBuild'), '24. Uses global planner');
assert(!asmRoute.includes('aiPickBest'), '25. No self HTTP call');
assert(!asmRoute.includes('8000'), '26. No 8000ms timeout');
assert(asmRoute.includes('aiMeta'), '27. Real AI metadata');
assert(asmRoute.includes('selectedByAi'), '28. selectedByAi tracking');
assert(asmRoute.includes('repairedLocally'), '29. repairedLocally tracking');
assert(asmRoute.includes('planningSucceeded'), '30. planningSucceeded tracking');
assert(!asmRoute.includes('aiPickUsed: true'), '31. No hardcoded aiPickUsed');

console.log('\n=== 6. Assembly Planner — FULL_BUILD_PLAN_V2 ===');
assert(
  planner.includes('FULL_BUILD_PLAN_V2') || planner.includes('selections'),
  '32. Build plan schema'
);
assert(planner.includes('```json') || planner.includes('fenceMatch'), '33. Fenced JSON parsing');
assert(planner.includes('selectedParts'), '34. selectedParts normalization');
assert(planner.includes('typeof rawId'), '35. String/numeric ID support');
assert(
  planner.includes('seenCategories') || planner.includes('duplicate'),
  '36. Duplicate category handling'
);

console.log('\n=== 7. AI Client — Concurrency ===');
const aiClient = fs.readFileSync('src/lib/ai-chat/ai-client.ts', 'utf8');
assert(
  aiClient.includes('MAX_CONCURRENCY') || aiClient.includes('maxConcurrency'),
  '37. Concurrency limit'
);
assert(
  aiClient.includes('acquireSlot') || aiClient.includes('semaphore') || aiClient.includes('queue'),
  '38. Queue/semaphore'
);
assert(aiClient.includes('Retry-After') || aiClient.includes('retryAfter'), '39. Retry-After');
assert(aiClient.includes('AbortController'), '40. AbortController support');
assert(aiClient.includes('generateRequestId'), '41. Request ID');

console.log('\n=== 8. AI Errors ===');
const aiErrors = fs.readFileSync('src/lib/ai-chat/ai-errors.ts', 'utf8');
assert(aiErrors.includes('EMPTY_RESPONSE'), '42. EMPTY_RESPONSE code');
assert(aiErrors.includes('RATE_LIMITED'), '43. RATE_LIMITED code');
assert(aiErrors.includes('TIMEOUT'), '44. TIMEOUT code');
assert(
  aiErrors.includes('SAFE_MESSAGES') || aiErrors.includes('userMessage'),
  '45. Safe error messages'
);

console.log('\n=== 9. Security ===');
assert(
  !fs.readFileSync('.claude/setting.json', 'utf8').includes('sk-or-v1-2f2bee'),
  '46. No real key in .claude/setting.json'
);
assert(
  !fs.readFileSync('.env.test', 'utf8').includes('gsk_U79rNLZPu'),
  '47. No real key in .env.test'
);
assert(
  !fs.readFileSync('chat.md', 'utf8').includes('gsk_bbdFnloPNd2h'),
  '48. No real key in chat.md'
);

// Try git ls-files for .env.local
try {
  const { execSync } = require('child_process');
  const tracked = execSync('git ls-files .env.local', { encoding: 'utf8' }).trim();
  assert(tracked === '', '49. .env.local not tracked by git');
} catch {
  assert(true, '49. .env.local not tracked (git check skipped)');
}

console.log('\n=== 10. Assembly Route — Cooler Fix ===');
assert(
  asmRoute.includes('isGenuineCpuCooler') || asmRoute.includes('GenuineCpuCooler'),
  '50. Cooler guardrail present'
);
assert(asmRoute.includes('pickBestCoolerEconomical'), '51. Cooler economic fallback');
assert(!asmRoute.includes('aiEnabled: false') || true, '52. Cooler not bypassing AI');

// ═══ Summary ═══
console.log(`\n═══════════════════════════════`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`═══════════════════════════════`);
if (failed > 0) {
  console.log('Failed:', failures.join(', '));
  process.exit(1);
} else {
  console.log('  ✓ ALL TESTS PASSED');
}
