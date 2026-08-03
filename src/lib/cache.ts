import { Redis } from '@upstash/redis';

const TTL         = 6 * 60 * 60;  // 6 hours  — good results (≥5 countries / ≥7 days)
const TTL_SHORT   = 30 * 60;      // 30 minutes — sparse results (3-4 countries / 3-6 days)
const TTL_MINIMAL = 15 * 60;      // 15 minutes — very sparse results (1-2 items); re-fetch sooner

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

export async function getCached(key: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    // Upstash SDK auto-parses JSON on get(), so a stored JSON string '[{...}]'
    // comes back as a JavaScript array. Re-serialize to string for Response body.
    const val = await redis.get(key);
    if (val === null || val === undefined) return null;
    return typeof val === 'string' ? val : JSON.stringify(val);
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: TTL });
  } catch {}
}

export async function setCachedShort(key: string, value: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: TTL_SHORT });
  } catch {}
}

export async function setCachedMinimal(key: string, value: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: TTL_MINIMAL });
  } catch {}
}
