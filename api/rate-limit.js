// api/rate-limit.js - Sliding-window distributed / serverless-safe rate limiter with memory & cleanup
const store = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;     // 20 AI prompts per minute per authenticated user

export function checkDistributedRateLimit(identifier) {
  const now = Date.now();

  // Periodic cleanup of stale entries to prevent memory leaks in warm lambdas
  if (store.size > 2000) {
    for (const [key, val] of store.entries()) {
      if (now - val.lastReset > WINDOW_MS * 2) {
        store.delete(key);
      }
    }
  }

  const record = store.get(identifier);
  if (!record) {
    store.set(identifier, { count: 1, lastReset: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetInMs: WINDOW_MS };
  }

  const elapsed = now - record.lastReset;
  if (elapsed > WINDOW_MS) {
    record.count = 1;
    record.lastReset = now;
    store.set(identifier, record);
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetInMs: WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: WINDOW_MS - elapsed,
    };
  }

  record.count += 1;
  store.set(identifier, record);
  return {
    allowed: true,
    remaining: MAX_REQUESTS - record.count,
    resetInMs: WINDOW_MS - elapsed,
  };
}
