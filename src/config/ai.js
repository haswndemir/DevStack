// src/config/ai.js - Centralized AI Model Configuration for Client
import { getModelDisplayName } from './model-utils.js';

export const AI_MODEL = 'gemini-3.8-flash';

export const CLIENT_AI_CONFIG = {
  endpoint: '/api/ai/chat',
  model: AI_MODEL,
  modelDisplay: getModelDisplayName(AI_MODEL),
  assistantName: 'DevBot',
};
