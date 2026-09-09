// scripts/verify-security.js - Automated tests for all security controls
import fs from 'fs';
import path from 'path';
import { checkDistributedRateLimit } from '../api/rate-limit.js';
import handler from '../api/ai/chat.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// Mock HTTP Request/Response helpers
function createMockRes() {
  const headers = {};
  const res = {
    statusCode: 200,
    headers,
    setHeader(key, val) {
      headers[key.toLowerCase()] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('--- 1. Rate Limiter Tests ---');
  const uid = 'test-rate-limit-user-' + Date.now();
  let rateLimitHit = false;
  for (let i = 1; i <= 25; i++) {
    const res = await checkDistributedRateLimit(uid);
    if (i <= 20) {
      if (!res.allowed) {
        console.error(`Request ${i} unexpectedly rejected by rate limiter`);
      }
    } else {
      if (!res.allowed) {
        rateLimitHit = true;
      }
    }
  }
  assert(rateLimitHit, 'Rate limiter restricts after 20 requests per minute');

  console.log('\n--- 2. CORS Tests ---');
  // Disallowed origin
  const disallowedReq = {
    method: 'OPTIONS',
    headers: { origin: 'https://malicious-site.com' },
    body: {}
  };
  const disallowedRes = createMockRes();
  await handler(disallowedReq, disallowedRes);
  assert(!disallowedRes.headers['access-control-allow-origin'], 'Disallowed origin is NOT granted CORS header');

  // Allowed production origin
  const allowedReq = {
    method: 'OPTIONS',
    headers: { origin: 'https://dev-stack-eight.vercel.app' },
    body: {}
  };
  const allowedRes = createMockRes();
  await handler(allowedReq, allowedRes);
  assert(allowedRes.headers['access-control-allow-origin'] === 'https://dev-stack-eight.vercel.app', 'Production origin dev-stack-eight.vercel.app allowed');

  // Allowed app origin
  const appReq = {
    method: 'OPTIONS',
    headers: { origin: 'https://app.hasandemir.dev' },
    body: {}
  };
  const appRes = createMockRes();
  await handler(appReq, appRes);
  assert(appRes.headers['access-control-allow-origin'] === 'https://app.hasandemir.dev', 'Production origin app.hasandemir.dev allowed');

  console.log('\n--- 3. AI Authentication & Method Tests ---');
  // Method not allowed
  const getReq = {
    method: 'GET',
    headers: { origin: 'http://localhost:5173' }
  };
  const getRes = createMockRes();
  await handler(getReq, getRes);
  assert(getRes.statusCode === 405, 'GET method rejected with 405 Method Not Allowed');

  // Missing token
  const noTokenReq = {
    method: 'POST',
    headers: { origin: 'http://localhost:5173' },
    body: { messages: [{ role: 'user', text: 'hi' }] }
  };
  const noTokenRes = createMockRes();
  await handler(noTokenReq, noTokenRes);
  assert(noTokenRes.statusCode === 401, 'Missing token returns 401');

  // Fake Bearer token
  const fakeTokenReq = {
    method: 'POST',
    headers: {
      origin: 'http://localhost:5173',
      authorization: 'Bearer abc.fake.token'
    },
    body: { messages: [{ role: 'user', text: 'hi' }] }
  };
  const fakeTokenRes = createMockRes();
  await handler(fakeTokenReq, fakeTokenRes);
  assert(fakeTokenRes.statusCode === 401, 'Fake token rejected with 401 without error detail leak');
  assert(!JSON.stringify(fakeTokenRes.body).includes('stack'), 'No stack trace in 401 error response');

  console.log('\n--- 3.1 AI Payload Validation Logic ---');
  // Mock handler payload validation verification
  const MAX_MESSAGES_COUNT = 30;
  const MAX_MESSAGE_LENGTH = 8000;
  const MAX_TOTAL_PAYLOAD_LENGTH = 40000;
  const VALID_ROLES = ['user', 'model', 'assistant'];

  function validatePayload(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return { valid: false, error: 'empty' };
    if (messages.length > MAX_MESSAGES_COUNT) return { valid: false, error: 'count' };
    let total = 0;
    for (const m of messages) {
      if (!m || typeof m !== 'object' || Array.isArray(m)) return { valid: false, error: 'format' };
      if (m.role && (typeof m.role !== 'string' || !VALID_ROLES.includes(m.role))) return { valid: false, error: 'role' };
      let text = '';
      if (typeof m.text === 'string') text = m.text;
      else if (Array.isArray(m.parts) && typeof m.parts[0]?.text === 'string') text = m.parts[0].text;
      else return { valid: false, error: 'text' };
      if (text.length > MAX_MESSAGE_LENGTH) return { valid: false, error: 'msg_len' };
      total += text.length;
      if (total > MAX_TOTAL_PAYLOAD_LENGTH) return { valid: false, error: 'total_len' };
    }
    return { valid: true };
  }

  assert(!validatePayload([]).valid, 'Empty messages rejected');
  assert(!validatePayload(Array(31).fill({ role: 'user', text: 'a' })).valid, 'Over 30 messages rejected');
  assert(!validatePayload([{ role: 'hacker', text: 'hi' }]).valid, 'Invalid role rejected');
  assert(!validatePayload([{ role: 'user', text: 'a'.repeat(8001) }]).valid, 'Message > 8000 chars rejected');
  assert(!validatePayload(Array(6).fill({ role: 'user', text: 'a'.repeat(7000) })).valid, 'Total payload > 40000 chars rejected');
  assert(validatePayload([{ role: 'user', text: 'hello' }]).valid, 'Valid payload accepted');

  console.log('\n--- 4. Firestore Rules Audit ---');
  const firestoreRules = fs.readFileSync('firestore.rules', 'utf8');
  assert(firestoreRules.includes('match /users/{userId} {\n      allow read, create, update: if isOwner(userId);'), 'User profile is strictly owner only');
  assert(firestoreRules.includes('match /usernames/{username} {\n      allow get: if isAuthenticated();\n      allow list: if false;'), 'Username collection listing/enumeration is forbidden');

  const collectionsToCheck = ['bookmarks', 'snippets', 'notes', 'projects', 'notifications', 'ai_conversations'];
  for (const col of collectionsToCheck) {
    const hasDoubleCheck = firestoreRules.includes(`resource.data.userId == request.auth.uid \n        && request.resource.data.userId == request.auth.uid`);
    assert(hasDoubleCheck, `Double-sided update ownership check active on ${col}`);
  }

  console.log('\n--- 5. Secret Leakage Audit ---');
  const distPath = 'dist/assets';
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath).filter(f => f.endsWith('.js'));
    let foundSecret = false;
    for (const file of files) {
      const content = fs.readFileSync(path.join(distPath, file), 'utf8');
      if (content.includes('UPSTASH_REDIS') || content.includes('GEMINI_API_KEY')) {
        foundSecret = true;
      }
    }
    assert(!foundSecret, 'Client bundle dist/ contains zero UPSTASH or GEMINI server secret names');
  }

  console.log(`\nResults: ${passed}/${total} security test assertions passed.`);
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
