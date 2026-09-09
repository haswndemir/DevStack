// scripts/verify-ai.js - Comprehensive Developer Capabilities Test
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG } from '../api/config.js';

// Read API Key from .env or process.env
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    if (line.startsWith('GEMINI_API_KEY=')) {
      apiKey = line.split('=')[1].trim();
    }
  }
}

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found in environment or .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function executeWithFallback(prompt) {
  const modelsToTry = [AI_CONFIG.model, ...(AI_CONFIG.fallbackModels || [])];
  let lastError = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        if (result && result.text) {
          return { text: result.text, modelUsed: model };
        }
      } catch (err) {
        lastError = err;
        // If high demand 503 or 429, wait 2s before retrying
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
  }
  throw lastError || new Error('All configured models failed');
}

async function runVerification() {
  console.log('==================================================');
  console.log(`Verifying DevStack AI Capabilities (Primary: ${AI_CONFIG.model})`);
  console.log('==================================================\n');

  const tasks = [
    { name: '1. AI Chat', prompt: 'Hello DevBot! Briefly introduce yourself.' },
    { name: '2. Code Explanation', prompt: 'Explain the difference between let, const, and var in 2 bullet points.' },
    { name: '3. Code Generation', prompt: 'Generate a TypeScript function to check if a string is a valid URL.' },
    { name: '4. Refactoring', prompt: 'Refactor this JavaScript code to use async/await:\nfunction load() { return fetch(url).then(r => r.json()); }' },
    { name: '5. Bug Analysis', prompt: 'Find the bug in this code:\nfor (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 100); }' },
    { name: '6. Test Generation', prompt: 'Write a unit test for a multiply(x, y) helper.' },
    { name: '7. Documentation', prompt: 'Generate JSDoc comments for a debounce(fn, ms) utility.' },
    { name: '8. Note Summarization', prompt: 'Summarize into 2 bullets:\nArchitecture decided: SPA with Vite, Firebase Auth, Firestore BaaS, and serverless proxy.' },
    { name: '9. Snippet Generation', prompt: 'Provide a clean snippet for deep cloning an object using structuredClone.' },
  ];

  let passed = 0;
  for (const task of tasks) {
    try {
      const start = Date.now();
      const res = await executeWithFallback(task.prompt);
      const duration = Date.now() - start;
      console.log(`✅ ${task.name} (${res.modelUsed}, ${duration}ms)`);
      passed++;
      // Wait 1.5s to respect free tier rate limit
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`❌ ${task.name} FAILED:`, err.message);
    }
  }

  console.log(`\nVerification Complete: ${passed}/${tasks.length} developer capabilities passed!`);
  if (passed === tasks.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
