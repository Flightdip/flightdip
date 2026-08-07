import { getCached, setCached, setCachedShort, setCachedMinimal } from '@/lib/cache';
import { getAirportCityMap } from '@/lib/refData';

const TOKEN = '81ad36058d36921b8a622de955723761';
const BASE   = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';

const COUNTRIES = [
  { code: 'JP', airport: 'NRT', country: 'ญี่ปุ่น',               countryEn: 'Japan',        flag: '🇯🇵', airportName: 'สนามบินนาริตะ'           },
  { code: 'JP', airport: 'HND', country: 'ญี่ปุ่น',               countryEn: 'Japan',        flag: '🇯🇵', airportName: 'สนามบินฮาเนดะ'           },
  { code: 'JP', airport: 'KIX', country: 'ญี่ปุ่น',               countryEn: 'Japan',        flag: '🇯🇵', airportName: 'สนามบินคันไซ'             },
  { code: 'KR', airport: 'ICN', country: 'เกาหลีใต้',             countryEn: 'South Korea',  flag: '🇰🇷', airportName: 'สนามบินอินชอน'            },
  { code: 'SG', airport: 'SIN', country: 'สิงคโปร์',              countryEn: 'Singapore',    flag: '🇸🇬', airportName: 'สนามบินชางงี'             },
  { code: 'TW', airport: 'TPE', country: 'ไต้หวัน',               countryEn: 'Taiwan',       flag: '🇹🇼', airportName: 'สนามบินเถาหยวน'           },
  { code: 'HK', airport: 'HKG', country: 'ฮ่องกง',                countryEn: 'Hong Kong',    flag: '🇭🇰', airportName: 'สนามบินฮ่องกง'            },
  { code: 'MY', airport: 'KUL', country: 'มาเลเซีย',              countryEn: 'Malaysia',     flag: '🇲🇾', airportName: 'สนามบินกัวลาลัมเปอร์'     },
  { code: 'VN', airport: 'SGN', country: 'เวียดนาม',              countryEn: 'Vietnam',      flag: '🇻🇳', airportName: 'สนามบินเติ้นเซินเญิ้ต'    },
  { code: 'ID', airport: 'CGK', country: 'อินโดนีเซีย',           countryEn: 'Indonesia',    flag: '🇮🇩', airportName: 'สนามบินซูการ์โน-ฮัตตา'   },
  { code: 'PH', airport: 'MNL', country: 'ฟิลิปปินส์',            countryEn: 'Philippines',  flag: '🇵🇭', airportName: 'สนามบินอากีโน'            },
  { code: 'CN', airport: 'PEK', country: 'จีน',                    countryEn: 'China',        flag: '🇨🇳', airportName: 'สนามบินปักกิ่ง'           },
  { code: 'CN', airport: 'PVG', country: 'จีน',                    countryEn: 'China',        flag: '🇨🇳', airportName: 'สนามบินผู่ตง'             },
  { code: 'IN', airport: 'DEL', country: 'อินเดีย',               countryEn: 'India',        flag: '🇮🇳', airportName: 'สนามบินอินทิรา คานธี'     },
  { code: 'GB', airport: 'LHR', country: 'สหราชอาณาจักร',         countryEn: 'United Kingdom', flag: '🇬🇧', airportName: 'สนามบินฮีทโธรว์'        },
  { code: 'FR', airport: 'CDG', country: 'ฝรั่งเศส',              countryEn: 'France',       flag: '🇫🇷', airportName: 'สนามบินชาร์ล เดอ โกล'    },
  { code: 'DE', airport: 'FRA', country: 'เยอรมนี',               countryEn: 'Germany',      flag: '🇩🇪', airportName: 'สนามบินแฟรงก์เฟิร์ต'      },
  { code: 'IT', airport: 'FCO', country: 'อิตาลี',                countryEn: 'Italy',        flag: '🇮🇹', airportName: 'สนามบินฟิอูมิชิโน'         },
  { code: 'ES', airport: 'MAD', country: 'สเปน',                  countryEn: 'Spain',        flag: '🇪🇸', airportName: 'สนามบินบาราคัส'           },
  { code: 'NL', airport: 'AMS', country: 'เนเธอร์แลนด์',          countryEn: 'Netherlands',  flag: '🇳🇱', airportName: 'สนามบินสคิปโพล'           },
  { code: 'CH', airport: 'ZRH', country: 'สวิตเซอร์แลนด์',        countryEn: 'Switzerland',  flag: '🇨🇭', airportName: 'สนามบินซูริก'             },
  { code: 'US', airport: 'LAX', country: 'สหรัฐอเมริกา',          countryEn: 'USA',          flag: '🇺🇸', airportName: 'สนามบินลอสแองเจลิส'       },
  { code: 'AU', airport: 'SYD', country: 'ออสเตรเลีย',            countryEn: 'Australia',    flag: '🇦🇺', airportName: 'สนามบินซิดนีย์'           },
  { code: 'NZ', airport: 'AKL', country: 'นิวซีแลนด์',            countryEn: 'New Zealand',  flag: '🇳🇿', airportName: 'สนามบินโอ๊คแลนด์'         },
  { code: 'AE', airport: 'DXB', country: 'สหรัฐอาหรับเอมิเรตส์', countryEn: 'UAE',          flag: '🇦🇪', airportName: 'สนามบินดูไบ'              },
  { code: 'TR', airport: 'IST', country: 'ตุรกี',                 countryEn: 'Turkey',       flag: '🇹🇷', airportName: 'สนามบินอิสตันบูล'         },
  { code: 'LK', airport: 'CMB', country: 'ศรีลังกา',              countryEn: 'Sri Lanka',    flag: '🇱🇰', airportName: 'สนามบินบันดาราไนเก'       },
  { code: 'NP', airport: 'KTM', country: 'เนปาล',                 countryEn: 'Nepal',        flag: '🇳🇵', airportName: 'สนามบินตรีภูวัน'          },
  { code: 'MV', airport: 'MLE', country: 'มัลดีฟส์',              countryEn: 'Maldives',     flag: '🇲🇻', airportName: 'สนามบินเวลานา'            },
];

type Country = typeof COUNTRIES[number];

function minutesToThai(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}ช. ${m}น.` : `${h}ช.`;
}

// Returns YYYY-MM of the following month (month format for return_at — exact dates give empty results)
function nextMonthYM(date: string): string {
  const [y, m] = date.split('-').map(Number);
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

async function fetchPrice(origin: string, date: string, c: Country) {
  const returnAt = nextMonthYM(date); // YYYY-MM format — month format returns reliably
  try {
    const [owRes, rtRes] = await Promise.all([
      fetch(`${BASE}?origin=${origin}&destination=${c.airport}&departure_at=${date}&one_way=true&currency=thb&limit=1&token=${TOKEN}`, { signal: AbortSignal.timeout(10000) }),
      fetch(`${BASE}?origin=${origin}&destination=${c.airport}&departure_at=${date}&return_at=${returnAt}&currency=thb&limit=1&token=${TOKEN}`, { signal: AbortSignal.timeout(10000) }),
    ]);
    const [owJson, rtJson] = await Promise.all([
      owRes.ok ? owRes.json() : Promise.resolve({ success: false }),
      rtRes.ok ? rtRes.json() : Promise.resolve({ success: false }),
    ]);
    if (!owJson.success || !owJson.data?.length) return null;
    const t = owJson.data[0];
    const link = `https://www.aviasales.com${t.link}`;

    let returnPrice: number | null = (rtJson.success && rtJson.data?.length) ? rtJson.data[0].price as number : null;
    let returnPriceIsEstimate = false;

    if (returnPrice === null) {
      // Fallback: sum cheapest one-way outbound + cheapest one-way return (dest→origin)
      try {
        const revUrl = `${BASE}?origin=${c.airport}&destination=${origin}&departure_at=${returnAt}&one_way=true&currency=thb&limit=1&token=${TOKEN}`;
        const revRes = await fetch(revUrl, { signal: AbortSignal.timeout(10000) });
        const revJson = revRes.ok ? await revRes.json() : { success: false };
        if (revJson.success && revJson.data?.length) {
          returnPrice = (t.price as number) + (revJson.data[0].price as number);
          returnPriceIsEstimate = true;
        }
      } catch {}
    }

    return {
      code: c.code,
      airportCode: c.airport,
      country: c.country,
      countryEn: c.countryEn,
      flag: c.flag,
      airportName: c.airportName,
      price: t.price as number,
      departure_at: t.departure_at as string,
      airline: t.airline as string,
      duration: minutesToThai(t.duration_to as number),
      stops: Math.min(t.transfers as number, 1) as 0 | 1,
      returnPrice,
      returnPriceIsEstimate,
      link,
      googleFlightsUrl: link,
    };
  } catch {
    return null;
  }
}

// Non-Thai origins mapped to their country code so we can skip self-routes
const AIRPORT_TO_COUNTRY_CODE: Record<string, string> = {
  SIN: 'SG', KUL: 'MY', CGK: 'ID', HAN: 'VN', SGN: 'VN',
};

export async function POST(req: Request) {
  const { origin, date } = await req.json();
  const cacheKey = `sd2:${origin}:${date}`;

  const hit = await getCached(cacheKey);
  if (hit) return new Response(hit, { headers: { 'Content-Type': 'application/json' } });

  const selfCode = AIRPORT_TO_COUNTRY_CODE[origin as string] ?? null;
  const targets = selfCode ? COUNTRIES.filter(c => c.code !== selfCode) : COUNTRIES;

  // Fetch Travelpayouts ref data in parallel with price fan-out (cached 24h)
  const [settled, refData] = await Promise.all([
    Promise.all(targets.map(c => fetchPrice(origin, date, c))),
    getAirportCityMap().catch(() => ({} as Record<string, { city: string; airport: string }>)),
  ]);

  // Group by country code, keep cheapest airport per country
  const byCode = new Map<string, NonNullable<typeof settled[number]>>();
  for (const r of settled.filter(Boolean) as NonNullable<typeof settled[number]>[]) {
    const enriched = refData[r.airportCode] ? { ...r, airportName: refData[r.airportCode].city } : r;
    const ex = byCode.get(enriched.code);
    if (!ex || enriched.price < ex.price) byCode.set(enriched.code, enriched);
  }
  const results = Array.from(byCode.values())
    .sort((a, b) => a.price - b.price);

  const text = JSON.stringify(results);
  if (results.length >= 5) {
    await setCached(cacheKey, text);           // 6h — good results
  } else if (results.length >= 3) {
    await setCachedShort(cacheKey, text);      // 30min — sparse
  } else if (results.length > 0) {
    await setCachedMinimal(cacheKey, text);    // 15min — very sparse, retry soon
  }
  return new Response(text, { headers: { 'Content-Type': 'application/json' } });
}
