// api/ai/chat.js - Production-Hardened Serverless AI Endpoint
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG } from '../config.js';
import { getModelDisplayName } from '../model-utils.js';
import { verifyFirebaseIdToken } from '../auth-verify.js';
import { checkDistributedRateLimit } from '../rate-limit.js';

// Payload Limits
const MAX_MESSAGES_COUNT = 30;
const MAX_MESSAGE_LENGTH = 8000;
const MAX_TOTAL_PAYLOAD_LENGTH = 40000;

// Production Allowed Origins
const ALLOWED_ORIGINS = [
  'https://dev-stack-eight.vercel.app',
  'https://app.hasandemir.dev',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
];

function resolveApiKey() {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('GEMINI_API_KEY=')) {
          return trimmed.split('=')[1].trim();
        }
      }
    }
  } catch {
    // Ignore fs errors in serverless environments
  }
  return null;
}

export default async function handler(req, res) {
  // 1. Strict CORS handling
  const origin = req.headers['origin'] || req.headers['Origin'] || '';
  const customAllowed = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  const fullAllowed = [...ALLOWED_ORIGINS, ...customAllowed];

  if (origin && fullAllowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin && process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Cryptographic Firebase Auth ID Token Verification
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  let verifiedUser;
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'devstack-d26a7';
    verifiedUser = await verifyFirebaseIdToken(token, projectId);
  } catch (authError) {
    console.warn('[AI Auth Security] Token verification rejected:', authError.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token.' });
  }

  // 3. User-based Distributed Rate Limiting
  const rateLimitResult = checkDistributedRateLimit(verifiedUser.uid);
  if (!rateLimitResult.allowed) {
    const retrySec = Math.ceil(rateLimitResult.resetInMs / 1000);
    res.setHeader('Retry-After', retrySec);
    return res.status(429).json({
      error: 'Too many requests. You have reached your AI usage limit. Please wait a moment and try again.',
      retryAfterSeconds: retrySec,
    });
  }

  // 4. Strict Payload Validation & Anti-Abuse
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid payload: messages array is required.' });
  }

  if (messages.length > MAX_MESSAGES_COUNT) {
    return res.status(400).json({ error: `Payload rejected: conversation exceeds maximum of ${MAX_MESSAGES_COUNT} messages.` });
  }

  let totalChars = 0;
  const formattedContents = [];

  for (const m of messages) {
    if (!m || typeof m !== 'object') {
      return res.status(400).json({ error: 'Invalid payload: malformed message object.' });
    }

    const role = (m.role === 'ai' || m.role === 'model') ? 'model' : 'user';
    let text = '';
    if (typeof m.text === 'string') {
      text = m.text;
    } else if (Array.isArray(m.parts) && typeof m.parts[0]?.text === 'string') {
      text = m.parts[0].text;
    } else {
      text = '';
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Payload rejected: individual message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters.` });
    }

    totalChars += text.length;
    if (totalChars > MAX_TOTAL_PAYLOAD_LENGTH) {
      return res.status(400).json({ error: 'Payload rejected: total conversation character limit exceeded.' });
    }

    formattedContents.push({
      role,
      parts: [{ text }],
    });
  }

  // 5. Gemini API Key Resolution
  const apiKey = resolveApiKey();
  if (!apiKey) {
    console.error('[AI Configuration Error] GEMINI_API_KEY is not defined.');
    return res.status(500).json({
      error: 'AI service configuration pending. Please configure server credentials.',
    });
  }

  // 6. Gemini Generative Execution
  try {
    const ai = new GoogleGenAI({ apiKey });
    const candidateModels = [AI_CONFIG.model, ...(AI_CONFIG.fallbackModels || [])];
    let result = null;
    let modelUsed = AI_CONFIG.model;
    let lastError = null;

    for (const modelToTry of candidateModels) {
      try {
        result = await ai.models.generateContent({
          model: modelToTry,
          contents: formattedContents,
          config: {
            systemInstruction: AI_CONFIG.systemInstruction,
          },
        });
        if (result && (result.text || result.candidates)) {
          modelUsed = modelToTry;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[AI Engine] Attempt with ${modelToTry} failed (${err.status || err.code || err.message}). Attempting fallback...`);
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    if (!result) {
      throw lastError || new Error('All configured Gemini Flash models failed to respond.');
    }

    const reply = result.text || 'Cevap üretilemedi.';
    return res.status(200).json({
      reply,
      modelUsed,
      modelDisplay: getModelDisplayName(modelUsed),
    });
  } catch (error) {
    // 7. Error Sanitization: Prevent internal stack trace/key leakage
    console.error('[AI Engine Failure]:', error);
    return res.status(500).json({
      error: 'An internal error occurred while generating the AI response. Please try again later.',
    });
  }
}
