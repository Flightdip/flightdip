import { Redis } from '@upstash/redis';

export async function POST(req: Request) {
  const { secret, pattern } = await req.json();
  if (secret !== process.env.FLUSH_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const redis = Redis.fromEnv();
  const keys: string[] = [];
  let cursor = 0;
  do {
    const [next, batch] = await redis.scan(cursor, { match: pattern ?? 'sc:*', count: 100 });
    cursor = Number(next);
    keys.push(...(batch as string[]));
  } while (cursor !== 0);

  if (keys.length > 0) {
    await redis.del(...keys);
  }

  return new Response(JSON.stringify({ deleted: keys.length, keys }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
