// api/config.js - Centralized Server AI Model Configuration
import { getModelDisplayName } from './model-utils.js';

// Single source of truth for the serverless AI endpoint.
// Can also be dynamically configured via GEMINI_MODEL environment variable without code changes.
export const AI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export const AI_CONFIG = {
  model: AI_MODEL,
  modelDisplay: getModelDisplayName(AI_MODEL),
  // Resilient fallback chain across official production Flash models
  fallbackModels: ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-flash-latest'],
  systemInstruction: 'You are DevStack AI, a senior full-stack software engineer and developer companion. Provide concise, clear, accurate, and secure code suggestions with markdown explanations.',
};
