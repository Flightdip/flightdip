import { getCached, setCached } from '@/lib/cache';

const TOKEN = '81ad36058d36921b8a622de955723761';
const BASE   = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';

const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

export async function POST(req: Request) {
  const { origin, destination, yearMonth } = await req.json();
  const cacheKey = `sd:${origin}:${destination}:${yearMonth}`;

  const hit = await getCached(cacheKey);
  if (hit) {
    return new Response(hit, { headers: { 'Content-Type': 'application/json' } });
  }

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

  try {
    const url = `${BASE}?origin=${origin}&destination=${destination}&departure_at=${yearMonth}&one_way=true&currency=thb&limit=30&token=${TOKEN}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });

    if (!res.ok) {
      return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
    }

    const json = await res.json();

    if (!json.success || !json.data) {
      return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
    }

    // Build map: YYYY-MM-DD → cheapest ticket (data already sorted by price asc)
    const ticketByDate = new Map<string, Record<string, unknown>>();
    for (const t of json.data as Record<string, unknown>[]) {
      const dateStr = (t.departure_at as string).slice(0, 10);
      if (!ticketByDate.has(dateStr)) {
        ticketByDate.set(dateStr, t);
      }
    }

    const results = dates
      .flatMap(d => {
        const t = ticketByDate.get(d.date);
        if (!t) return [];
        const link = `https://www.aviasales.com${t.link}`;
        return [{
          date: d.date,
          dayOfWeek: d.dayOfWeek,
          displayDate: d.displayDate,
          price: t.price as number,
          link,
          googleFlightsUrl: link,
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
