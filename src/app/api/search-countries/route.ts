import { getCached, setCached } from '@/lib/cache';

const TOKEN = '81ad36058d36921b8a622de955723761';
const BASE   = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';

const COUNTRIES = [
  { code: 'JP', airport: 'NRT', country: 'ญี่ปุ่น',               countryEn: 'Japan',        flag: '🇯🇵', airportName: 'สนามบินนาริตะ'           },
  { code: 'KR', airport: 'ICN', country: 'เกาหลีใต้',             countryEn: 'South Korea',  flag: '🇰🇷', airportName: 'สนามบินอินชอน'            },
  { code: 'SG', airport: 'SIN', country: 'สิงคโปร์',              countryEn: 'Singapore',    flag: '🇸🇬', airportName: 'สนามบินชางงี'             },
  { code: 'TW', airport: 'TPE', country: 'ไต้หวัน',               countryEn: 'Taiwan',       flag: '🇹🇼', airportName: 'สนามบินเถาหยวน'           },
  { code: 'HK', airport: 'HKG', country: 'ฮ่องกง',                countryEn: 'Hong Kong',    flag: '🇭🇰', airportName: 'สนามบินฮ่องกง'            },
  { code: 'MY', airport: 'KUL', country: 'มาเลเซีย',              countryEn: 'Malaysia',     flag: '🇲🇾', airportName: 'สนามบินกัวลาลัมเปอร์'     },
  { code: 'VN', airport: 'SGN', country: 'เวียดนาม',              countryEn: 'Vietnam',      flag: '🇻🇳', airportName: 'สนามบินเติ้นเซินเญิ้ต'    },
  { code: 'ID', airport: 'CGK', country: 'อินโดนีเซีย',           countryEn: 'Indonesia',    flag: '🇮🇩', airportName: 'สนามบินซูการ์โน-ฮัตตา'   },
  { code: 'PH', airport: 'MNL', country: 'ฟิลิปปินส์',            countryEn: 'Philippines',  flag: '🇵🇭', airportName: 'สนามบินอากีโน'            },
  { code: 'CN', airport: 'PEK', country: 'จีน',                    countryEn: 'China',        flag: '🇨🇳', airportName: 'สนามบินปักกิ่ง'           },
  { code: 'IN', airport: 'DEL', country: 'อินเดีย',               countryEn: 'India',        flag: '🇮🇳', airportName: 'สนามบินอินทิรา คานธี'     },
  { code: 'EU', airport: 'LHR', country: 'ยุโรป',                 countryEn: 'Europe',       flag: '🇪🇺', airportName: 'สนามบินฮีทโธรว์'          },
  { code: 'US', airport: 'LAX', country: 'สหรัฐอเมริกา',          countryEn: 'USA',          flag: '🇺🇸', airportName: 'สนามบินลอสแองเจลิส'       },
  { code: 'AU', airport: 'SYD', country: 'ออสเตรเลีย',            countryEn: 'Australia',    flag: '🇦🇺', airportName: 'สนามบินซิดนีย์'           },
  { code: 'NZ', airport: 'AKL', country: 'นิวซีแลนด์',            countryEn: 'New Zealand',  flag: '🇳🇿', airportName: 'สนามบินโอ๊คแลนด์'         },
  { code: 'AE', airport: 'DXB', country: 'สหรัฐอาหรับเอมิเรตส์', countryEn: 'UAE',          flag: '🇦🇪', airportName: 'สนามบินดูไบ'              },
  { code: 'TR', airport: 'IST', country: 'ตุรกี',                 countryEn: 'Turkey',       flag: '🇹🇷', airportName: 'สนามบินอิสตันบูล'         },
  { code: 'LK', airport: 'CMB', country: 'ศรีลังกา',              countryEn: 'Sri Lanka',    flag: '🇱🇰', airportName: 'สนามบินบันดาราไนเก'       },
  { code: 'NP', airport: 'KTM', country: 'เนปาล',                 countryEn: 'Nepal',        flag: '🇳🇵', airportName: 'สนามบินตรีภูวัน'          },
  { code: 'MV', airport: 'MLE', country: 'มัลดีฟส์',              countryEn: 'Maldives',     flag: '🇲🇻', airportName: 'สนามบินเวลานา'            },
];

const BY_AIRPORT = new Map(COUNTRIES.map(c => [c.airport, c]));

function minutesToThai(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}ช. ${m}น.` : `${h}ช.`;
}

export async function POST(req: Request) {
  const { origin, date } = await req.json();
  const yearMonth = (date as string).slice(0, 7);
  const cacheKey = `sc:${origin}:${yearMonth}`;

  const hit = await getCached(cacheKey);
  if (hit) return new Response(hit, { headers: { 'Content-Type': 'application/json' } });

  try {
    const url = `${BASE}?origin=${origin}&departure_at=${date}&one_way=true&currency=thb&limit=100&token=${TOKEN}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return new Response('[]', { headers: { 'Content-Type': 'application/json' } });

    const json = await res.json();
    if (!json.success || !json.data?.length) return new Response('[]', { headers: { 'Content-Type': 'application/json' } });

    // Cheapest ticket per destination airport
    const cheapestByAirport = new Map<string, Record<string, unknown>>();
    for (const t of json.data as Record<string, unknown>[]) {
      const dest = t.destination as string;
      const existing = cheapestByAirport.get(dest);
      if (!existing || (t.price as number) < (existing.price as number)) {
        cheapestByAirport.set(dest, t);
      }
    }

    const results = Array.from(cheapestByAirport.values())
      .flatMap(t => {
        const c = BY_AIRPORT.get(t.destination as string);
        if (!c) return [];
        const link = `https://www.aviasales.com${t.link}`;
        return [{
          code: c.code,
          airport: c.airport,
          country: c.country,
          countryEn: c.countryEn,
          flag: c.flag,
          airportName: c.airportName,
          price: t.price as number,
          departure_at: t.departure_at as string,
          airline: t.airline as string,
          duration: minutesToThai(t.duration_to as number),
          stops: Math.min(t.transfers as number, 1) as 0 | 1,
          link,
          googleFlightsUrl: link,
        }];
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 10);

    const text = JSON.stringify(results);
    if (results.length > 0) await setCached(cacheKey, text);
    return new Response(text, { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  }
}
