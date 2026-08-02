import { getCached, setCached, setCachedShort, setCachedMinimal } from '@/lib/cache';

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
  // YYYY-MM format — month format returns reliably; exact dates give empty results
  const returnAt  = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;

  try {
    const [owRes, rtRes, revRes] = await Promise.all([
      // limit=100: API may return multiple results per date (different airlines); 100 covers 30-day months with ~3 options/day
      fetch(`${BASE}?origin=${origin}&destination=${destination}&departure_at=${yearMonth}&one_way=true&currency=thb&limit=100&token=${TOKEN}`, { signal: AbortSignal.timeout(15000) }),
      fetch(`${BASE}?origin=${origin}&destination=${destination}&departure_at=${yearMonth}&return_at=${returnAt}&currency=thb&limit=100&token=${TOKEN}`, { signal: AbortSignal.timeout(15000) }),
      // Fallback: cheapest reverse one-way (dest→origin) in return month
      fetch(`${BASE}?origin=${destination}&destination=${origin}&departure_at=${returnAt}&one_way=true&currency=thb&limit=10&token=${TOKEN}`, { signal: AbortSignal.timeout(15000) }),
    ]);

    const [owJson, rtJson, revJson] = await Promise.all([
      owRes.ok ? owRes.json() : Promise.resolve({ success: false }),
      rtRes.ok ? rtRes.json() : Promise.resolve({ success: false }),
      revRes.ok ? revRes.json() : Promise.resolve({ success: false }),
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

    // Fallback: cheapest available reverse one-way price in the return month
    let reverseOwPrice: number | null = null;
    if (revJson.success && Array.isArray(revJson.data) && revJson.data.length > 0) {
      reverseOwPrice = Math.min(...(revJson.data as Record<string, unknown>[]).map(t => t.price as number));
    }

    const results = dates
      .flatMap(d => {
        const t = owByDate.get(d.date);
        if (!t) return [];
        const link = `https://www.aviasales.com${t.link}`;

        let returnPrice: number | null = rtByDate.get(d.date) ?? null;
        let returnPriceIsEstimate = false;

        if (returnPrice === null && reverseOwPrice !== null) {
          returnPrice = (t.price as number) + reverseOwPrice;
          returnPriceIsEstimate = true;
        }

        return [{
          date: d.date,
          dayOfWeek: d.dayOfWeek,
          displayDate: d.displayDate,
          price: t.price as number,
          returnPrice,
          returnPriceIsEstimate,
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
    if (results.length >= 7) {
      await setCached(cacheKey, text);           // 6h — good coverage (≥7 days)
    } else if (results.length >= 3) {
      await setCachedShort(cacheKey, text);      // 30min — sparse (3-6 days)
    } else if (results.length > 0) {
      await setCachedMinimal(cacheKey, text);    // 15min — very sparse (1-2 days), retry soon
    }
    return new Response(text, { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  }
}
