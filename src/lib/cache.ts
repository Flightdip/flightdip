import { Redis } from '@upstash/redis';

const TTL = 6 * 60 * 60; // 6 hours

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
    return await redis.get<string>(key);
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: TTL });
  } catch {
    // cache miss is acceptable
  }
}
