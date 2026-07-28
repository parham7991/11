#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('=== OFFL AI ELITE UPGRADE — BASIC TEST RUNNER ===\n');

// 1. Check no hardcoded secrets
const files = [
  'src/lib/ai-chat/config.ts',
  'src/lib/ai-chat/providers.ts',
];

let errors = [];

const configText = fs.readFileSync('src/lib/ai-chat/config.ts', 'utf8');
if (configText.includes('gsk_')) {
  errors.push('CRITICAL: Hardcoded token still present in config.ts');
}
if (configText.includes('NEXT_PUBLIC_AI_CHAT_API_KEY')) {
  errors.push('CRITICAL: NEXT_PUBLIC secret usage found');
}

const providersText = fs.readFileSync('src/lib/ai-chat/providers.ts', 'utf8');
if (!providersText.includes('omniroute')) {
  errors.push('OmniRoute provider missing');
}

// 2. Check .env.example exists and has placeholder
const envExample = fs.readFileSync('.env.example', 'utf8');
if (!envExample.includes('__YOUR_OMNIROUTE_API_KEY__')) {
  errors.push('.env.example missing safe placeholder');
}

// 3. Check ZIP exclusions list prepared
if (fs.existsSync('.env.local')) {
  errors.push('WARNING: .env.local exists in workspace');
}

console.log('Errors:', errors.length);
errors.forEach(e => console.log(' -', e));

if (errors.length === 0) {
  console.log('PASS: Security, Provider, Environment checks OK');
} else {
  console.log('FAIL: See errors above');
  process.exit(1);
}
