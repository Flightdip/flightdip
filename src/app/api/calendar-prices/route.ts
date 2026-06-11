import { getCached, setCached } from '@/lib/cache';

const TOKEN = '81ad36058d36921b8a622de955723761';
const BASE   = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';

const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function minutesToThai(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}ช. ${m}น.` : `${h}ช.`;
}

export async function POST(req: Request) {
  const { origin, destination, yearMonth } = await req.json();
  const cacheKey = `cp:${origin}:${destination}:${yearMonth}`;

  const hit = await getCached(cacheKey);
  if (hit) return new Response(hit, { headers: { 'Content-Type': 'application/json' } });

  const [year, month] = (yearMonth as string).split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dow = new Date(year, month - 1, day).getDay();
    return {
      date: `${yearMonth}-${String(day).padStart(2, '0')}`,
      dayOfWeek: THAI_DAYS[dow],
      displayDate: `${THAI_DAYS[dow]} ${day} ${THAI_MONTHS_SHORT[month - 1]} ${year + 543}`,
    };
  });

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear  = month === 12 ? year + 1 : year;
  const returnAt  = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  try {
    const [owRes, rtRes] = await Promise.all([
      fetch(`${BASE}?origin=${origin}&destination=${destination}&departure_at=${yearMonth}-01&one_way=true&currency=thb&limit=30&token=${TOKEN}`, { signal: AbortSignal.timeout(15000) }),
      fetch(`${BASE}?origin=${origin}&destination=${destination}&departure_at=${yearMonth}-01&return_at=${returnAt}&currency=thb&limit=30&token=${TOKEN}`, { signal: AbortSignal.timeout(15000) }),
    ]);

    const [owJson, rtJson] = await Promise.all([
      owRes.ok ? owRes.json() : Promise.resolve({ success: false }),
      rtRes.ok ? rtRes.json() : Promise.resolve({ success: false }),
    ]);

    // One-way: first (cheapest) result per departure date
    const owByDate = new Map<string, Record<string, unknown>>();
    if (owJson.success && Array.isArray(owJson.data)) {
      for (const t of owJson.data as Record<string, unknown>[]) {
        const d = (t.departure_at as string).slice(0, 10);
        if (!owByDate.has(d)) owByDate.set(d, t);
      }
    }

    // Round-trip: first (cheapest) price per departure date
    const rtByDate = new Map<string, number>();
    if (rtJson.success && Array.isArray(rtJson.data)) {
      for (const t of rtJson.data as Record<string, unknown>[]) {
        const d = (t.departure_at as string).slice(0, 10);
        if (!rtByDate.has(d)) rtByDate.set(d, t.price as number);
      }
    }

    const results = dates
      .flatMap(d => {
        const t = owByDate.get(d.date);
        if (!t) return [];
        const link = `https://www.aviasales.com${t.link}`;
        return [{
          date: d.date,
          dayOfWeek: d.dayOfWeek,
          displayDate: d.displayDate,
          price: t.price as number,
          returnPrice: rtByDate.get(d.date) ?? null,
          link,
          googleFlightsUrl: link,
          airline: t.airline as string,
          airlineLogo: null,
          duration: minutesToThai(t.duration_to as number),
          stops: Math.min(t.transfers as number, 1) as 0 | 1,
        }];
      })
      .sort((a, b) => a.price - b.price);

    const text = JSON.stringify(results);
    if (results.length > 0) await setCached(cacheKey, text);
    return new Response(text, { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  }
}
