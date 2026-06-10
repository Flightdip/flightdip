const WEBHOOK = 'https://n8n-production-6984.up.railway.app/webhook/flight-search';

export async function POST(req: Request) {
  const body = await req.json();
  const upstream = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const text = await upstream.text();
  return new Response(text || '[]', {
    status: upstream.ok ? 200 : upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
