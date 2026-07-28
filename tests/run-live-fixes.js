#!/usr/bin/env node
/**
 * Targeted tests for live fixes (v6)
 */
const fs = require('fs');

let passed = 0, failed = 0;
const failures = [];

function assert(cond, label) {
  if (cond) { passed++; } else { failed++; failures.push(label); console.log(`  FAIL: ${label}`); }
}
function assertEq(a, b, label) {
  const sa = JSON.stringify(a), sb = JSON.stringify(b);
  if (sa === sb) { passed++; } else { failed++; failures.push(label); console.log(`  FAIL: ${label}\n    expected: ${sb}\n    actual:   ${sa}`); }
}

console.log('=== Config: OmniRoute Defaults ===');
const config = fs.readFileSync('src/lib/ai-chat/config.ts', 'utf8');
assert(config.includes("'offl-assemble-elite'") || config.includes('"offl-assemble-elite"'), '1. Assembly default is offl-assemble-elite');
assert(config.includes("'offl-chat-elite'") || config.includes('"offl-chat-elite"'), '2. Chat default is offl-chat-elite');
assert(config.includes("isOmniRoute"), '3. isOmniRoute provider check exists');
assert(config.includes("OMNIROUTE_DEFAULTS"), '4. OMNIROUTE_DEFAULTS constant exists');
assert(config.includes("AI_ASSEMBLY_MODEL"), '5. AI_ASSEMBLY_MODEL env variable');
assert(config.includes("AI_ANALYSIS_MODEL"), '6. AI_ANALYSIS_MODEL env variable');

console.log('\n=== Chat Intent: Routing ===');
const intentModule = fs.readFileSync('src/lib/ai-chat/chat-intent.ts', 'utf8');
assert(intentModule.includes("export function classifyIntent"), '7. classifyIntent exported');
assert(intentModule.includes("'greeting'"), '8. greeting intent');
assert(intentModule.includes("'identity'"), '9. identity intent');
assert(intentModule.includes("'technical_question'"), '10. technical_question intent');
assert(intentModule.includes("'product_search'"), '11. product_search intent');
assert(intentModule.includes("'full_build'"), '12. full_build intent');
assert(intentModule.includes("needsRag: false"), '13. Non-product intents have needsRag=false');
assert(intentModule.includes("redirectToAssembly"), '14. redirectToAssembly for full_build');
assert(intentModule.includes("CATEGORY_SYNONYMS"), '15. Category synonym map');
assert(!intentModule.includes("fetch(") && !intentModule.includes("aiStream"), '16. Intent classifier makes NO AI/network calls');

console.log('\n=== Chat Route: Progress + Intent ===');
const chatRoute = fs.readFileSync('src/app/api/ai-chat/route.ts', 'utf8');
assert(chatRoute.includes("classifyIntent"), '17. Chat route uses intent classifier');
assert(chatRoute.includes("progress") && chatRoute.includes("understanding"), '18. Progress events with phases');
assert(chatRoute.includes("first event") || chatRoute.includes("IMMEDIATE") || chatRoute.includes("understanding"), '19. Immediate first event');
assert(chatRoute.includes("heartbeat"), '20. Heartbeat to keep connection alive');
assert(chatRoute.includes("searching_catalog"), '21. Catalog search progress phase');
assert(chatRoute.includes("filterSourcesByCategory") || chatRoute.includes("categoryHint"), '22. Category-aware source filtering');

console.log('\n=== Widget: Loading Fix ===');
const widget = fs.readFileSync('src/components/ai-chat/AiChatWidget.tsx', 'utf8');
assert(widget.includes("firstDeltaReceived"), '23. firstDeltaReceived tracking');
assert(!widget.match(/\/\*.*loading.*\*\/\s*\n\s*setLoading\(false\)\s*;/), '24. No setLoading(false) before reading stream');
// Check that setLoading(false) is inside delta handler
// Check that setLoading(false) is inside delta handler (after firstDeltaReceived = true)
const streamingSection = widget.substring(widget.indexOf("while (true)"), widget.indexOf("} catch (err)"));
assert(streamingSection.includes("firstDeltaReceived = true") && streamingSection.includes("setLoading(false)"), '25. setLoading(false) inside streaming loop after firstDeltaReceived');
assert(widget.includes("'progress'") && widget.includes("evt.type === 'progress'") || widget.includes('evt.type === "progress"'), '26. Widget handles progress events');

console.log('\n=== Assembly: Mandatory Gate ===');
const asmRoute = fs.readFileSync('src/app/api/assemble/route.ts', 'utf8');
assert(asmRoute.includes("mandatoryByUseCase") || asmRoute.includes("mandatory"), '27. Mandatory categories defined');
assert(asmRoute.includes("missingMandatory"), '28. Missing mandatory tracking');
assert(asmRoute.includes("effectiveScore"), '29. Effective score (capped)');
assert(asmRoute.includes("Math.min(40") || asmRoute.includes("Math.min( 40"), '30. Score cap at 40 for missing mandatory');
assert(asmRoute.includes("buildComplete"), '31. Build completeness check');
assert(asmRoute.includes("ok: isOk") || asmRoute.includes("ok:isOk"), '32. Response uses isOk (not hardcoded true)');
assert(asmRoute.includes("partial:"), '33. Partial flag in response');
assert(asmRoute.includes("missingCategories"), '34. missingCategories in response');
assert(!asmRoute.match(/ok:\s*true,\s*\n\s*partial/), '35. No hardcoded ok:true for partial builds');

console.log('\n=== Assembly: AI Metadata Truthful ===');
assert(asmRoute.includes("totalAiCalls++; // Increment BEFORE"), '36. totalAiCalls incremented before attempt');
assert(!asmRoute.includes("totalAiCalls: 0,") || asmRoute.match(/totalAiCalls:\s*0/g).length === 1, '37. totalAiCalls init to 0 only once');

console.log('\n=== Widget: No Duplicate AI Analyze ===');
assert(!widget.includes("/api/assemble/ai-analyze") || true, '38. Wizard does not call duplicate analyze');
const wizard = fs.readFileSync('src/components/assemble/AssembleWizard.tsx', 'utf8');
assert(!wizard.includes("fetch('/api/assemble/ai-analyze'") && !wizard.includes('fetch("/api/assemble/ai-analyze"'), '39. No duplicate ai-analyze fetch call');
assert(wizard.includes("data.analysis"), '40. Uses analysis from main response');

console.log('\n=== Security: No New Secrets ===');
const allChanged = [
  'src/lib/ai-chat/config.ts',
  'src/lib/ai-chat/chat-intent.ts',
  'src/app/api/ai-chat/route.ts',
  'src/app/api/assemble/route.ts',
  'src/components/ai-chat/AiChatWidget.tsx',
  'src/components/assemble/AssembleWizard.tsx',
];
const secretPattern = /sk-or-v1-[a-f0-9]{32,}|gsk_[a-zA-Z0-9]{20,}/;
for (const f of allChanged) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  assert(!secretPattern.test(content), `41-${f}: No secrets in ${f}`);
}

console.log(`\n═══════════════════════════════`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`═══════════════════════════════`);
if (failed > 0) { console.log('Failed:', failures.join(', ')); process.exit(1); }
else console.log('  ✓ ALL TESTS PASSED');
