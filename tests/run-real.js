#!/usr/bin/env node
/**
 * Production intent tests
 *
 * This runner transpiles and executes the real TypeScript source module. It does
 * not copy the classifier tables or logic into the test, so a production/source
 * divergence cannot produce a false pass.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const productionPath = path.resolve(__dirname, '../src/lib/ai-chat/chat-intent.ts');

function loadProductionModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: filePath,
    reportDiagnostics: true,
  });

  const diagnostics = (result.diagnostics || []).filter(
    diagnostic => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: name => name,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  }));

  const module = { exports: {} };
  const wrapper = vm.runInThisContext(
    `(function (exports, require, module, __filename, __dirname) {\n${result.outputText}\n})`,
    { filename: filePath },
  );
  wrapper(module.exports, require, module, filePath, path.dirname(filePath));
  return module.exports;
}

const { classifyIntent } = loadProductionModule(productionPath);
assert.equal(typeof classifyIntent, 'function', 'production classifyIntent must be exported');

let passed = 0;
let failed = 0;
const failures = [];

function test(label, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${label}`);
  } catch (error) {
    failed += 1;
    failures.push(label);
    console.error(`  ✗ ${label}: ${error.message}`);
  }
}

function expectIntent(input, expected) {
  const result = classifyIntent(input);
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(result[key], value, `${input}: ${key}`);
  }
}

console.log('\n=== Production Intent Classifier Tests ===');

test('identity with an inserted sentence-length qualifier stays identity', () => {
  expectIntent('خودت رو در دو جمله معرفی کن', {
    intent: 'identity', needsRag: false, showCards: false, categoryHint: null,
  });
});

test('a normal SSD recommendation is product_search, not identity', () => {
  expectIntent('یک SSD NVMe یک ترابایت برای گیمینگ معرفی کن', {
    intent: 'product_search', needsRag: true, showCards: true, categoryHint: 'ssd',
  });
});

test('the live SSD shopping query is a grounded product request, not identity', () => {
  expectIntent('یک SSD NVMe یک ترابایت موجود برای گیمینگ معرفی کن', {
    intent: 'product_search', needsRag: true, showCards: true, categoryHint: 'ssd',
  });
});

test('می‌خوام expresses purchase intent and must not trigger negation', () => {
  expectIntent('می‌خوام یک SSD NVMe یک ترابایت معرفی کن', {
    intent: 'product_search', needsRag: true, showCards: true, categoryHint: 'ssd',
  });
});

test('نمی‌خوام suppresses product RAG and cards', () => {
  expectIntent('SSD معرفی نکن؛ فقط تفاوت NVMe و SATA را بگو، محصول نمی‌خوام', {
    intent: 'technical_question', needsRag: false, showCards: false, categoryHint: 'ssd',
  });
});

test('نمیخوام without ZWNJ also suppresses product RAG and cards', () => {
  expectIntent('برای DDR5 قیمت نمیخوام، فقط تفاوتش با DDR4 چیست؟', {
    intent: 'technical_question', needsRag: false, showCards: false, categoryHint: 'ram',
  });
});

test('technical no-product question remains card-free', () => {
  expectIntent('تفاوت DDR4 و DDR5 چیست؟ محصول معرفی نکن.', {
    intent: 'technical_question', needsRag: false, showCards: false, categoryHint: 'ram',
  });
});

console.log('\n═══════════════════════════════');
console.log(`  ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════');
if (failed > 0) {
  console.error(`Failed: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('  ✓ ALL PRODUCTION IMPORT TESTS PASSED');
