import { Redis } from '@upstash/redis';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 20;

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redisClient = new Redis({ url, token });
    return redisClient;
  }
  return null;
}

const fallbackStore = new Map();

export async function checkDistributedRateLimit(identifier) {
  const redis = getRedisClient();

  if (redis) {
    const key = `devstack:ratelimit:ai:${identifier}`;
    try {
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.ttl(key);
      const [count, ttl] = await pipeline.exec();

      if (ttl === -1) {
        await redis.expire(key, WINDOW_SECONDS);
      }

      const resetInMs = (ttl > 0 ? ttl : WINDOW_SECONDS) * 1000;

      if (count > MAX_REQUESTS) {
        return {
          allowed: false,
          remaining: 0,
          resetInMs,
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, MAX_REQUESTS - count),
        resetInMs,
      };
    } catch (err) {
      console.error('[RateLimit Redis Error]:', err.message);
      return { allowed: true, remaining: 1, resetInMs: WINDOW_SECONDS * 1000 };
    }
  }

  const now = Date.now();
  const windowMs = WINDOW_SECONDS * 1000;
  const record = fallbackStore.get(identifier);

  if (!record || now - record.lastReset > windowMs) {
    fallbackStore.set(identifier, { count: 1, lastReset: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetInMs: windowMs };
  }

  if (record.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: windowMs - (now - record.lastReset),
    };
  }

  record.count += 1;
  fallbackStore.set(identifier, record);
  return {
    allowed: true,
    remaining: MAX_REQUESTS - record.count,
    resetInMs: windowMs - (now - record.lastReset),
  };
}
