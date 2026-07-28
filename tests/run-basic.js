#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== OFFL AI ELITE — TEST RUNNER ===\n');

let errors = [];

// 1. Check no hardcoded secrets in source
const configText = fs.readFileSync('src/lib/ai-chat/config.ts', 'utf8');
if (configText.includes('gsk_')) errors.push('CRITICAL: Hardcoded token in config.ts');
if (configText.includes('NEXT_PUBLIC_AI_CHAT_API_KEY'))
  errors.push('CRITICAL: NEXT_PUBLIC secret usage');

const providersText = fs.readFileSync('src/lib/ai-chat/providers.ts', 'utf8');
if (!providersText.includes('omniroute')) errors.push('OmniRoute provider missing');

// 2. Check .env.example exists and has placeholder
const envExample = fs.readFileSync('.env.example', 'utf8');
if (!envExample.includes('__YOUR_OMNIROUTE_API_KEY__'))
  errors.push('.env.example missing safe placeholder');
if (!envExample.includes('AI_ASSEMBLY_MODEL'))
  errors.push('.env.example missing AI_ASSEMBLY_MODEL');
if (!envExample.includes('AI_ANALYSIS_MODEL'))
  errors.push('.env.example missing AI_ANALYSIS_MODEL');

// 3. .env.local must NOT be tracked by git
try {
  const tracked = execSync('git ls-files .env.local', { encoding: 'utf8' }).trim();
  if (tracked) errors.push('CRITICAL: .env.local is tracked by git');
} catch {}

// 4. Check no secrets in tracked files
const secretPatterns = [/sk-or-v1-[a-f0-9]{32,}/i, /gsk_[a-zA-Z0-9]{20,}/];
const trackedFiles = execSync('git ls-files', { encoding: 'utf8' }).trim().split('\n');
for (const file of trackedFiles) {
  if (!file || file.endsWith('.lock') || file.endsWith('.png') || file.endsWith('.jpg')) continue;
  try {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of secretPatterns) {
      const match = content.match(pattern);
      if (match) {
        // Skip if it's a placeholder
        if (match[0].includes('__') || match[0].includes('YOUR')) continue;
        errors.push(`CRITICAL: Secret pattern found in ${file}`);
      }
    }
  } catch {}
}

// 5. Check new files exist
const newFiles = [
  'src/lib/ai-chat/ai-client.ts',
  'src/lib/ai-chat/ai-errors.ts',
  'src/lib/ai-chat/assembly-planner.ts',
  'src/lib/ai-chat/sse-parser.ts',
];
for (const f of newFiles) {
  if (!fs.existsSync(f)) errors.push(`Missing required file: ${f}`);
}

// 6. Check config has separate models
if (!configText.includes('chatModel')) errors.push('Config missing chatModel');
if (!configText.includes('assemblyModel')) errors.push('Config missing assemblyModel');
if (!configText.includes('analysisModel')) errors.push('Config missing analysisModel');

// 7. Check no self HTTP call in assembly route
const assembleRoute = fs.readFileSync('src/app/api/assemble/route.ts', 'utf8');
if (assembleRoute.includes('/api/assemble/ai-pick'))
  errors.push('Assembly route still has self HTTP call');
if (assembleRoute.includes('aiPickBest'))
  errors.push('Assembly route still has aiPickBest function');
if (assembleRoute.includes('8000')) errors.push('Assembly route still has 8000ms timeout');

// 8. Check sanitizePrompt doesn't remove user words
if (configText.includes('\\bignore\\b') || configText.includes('\\btoken\\b')) {
  errors.push('sanitizePrompt still removes user words (should use role separation instead)');
}

console.log('Errors:', errors.length);
errors.forEach((e) => console.log(' -', e));

if (errors.length === 0) {
  console.log('\n✓ ALL BASIC CHECKS PASSED');
} else {
  console.log('\n✗ FAILURES DETECTED');
  process.exit(1);
}
