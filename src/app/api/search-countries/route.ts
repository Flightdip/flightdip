import { getCached, setCached, setCachedShort } from '@/lib/cache';

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
  const yearMonth = date.slice(0, 7); // YYYY-MM — API requires month format, not full date
  const returnAt = nextMonthYM(date); // YYYY-MM format — month format returns reliably
  try {
    const owUrl = `${BASE}?origin=${origin}&destination=${c.airport}&departure_at=${yearMonth}&one_way=true&currency=thb&limit=1&token=${TOKEN}`;
    const rtUrl = `${BASE}?origin=${origin}&destination=${c.airport}&departure_at=${yearMonth}&return_at=${returnAt}&currency=thb&limit=1&token=${TOKEN}`;
    const [owRes, rtRes] = await Promise.all([
      fetch(owUrl, { signal: AbortSignal.timeout(10000) }),
      fetch(rtUrl, { signal: AbortSignal.timeout(10000) }),
    ]);
    const [owJson, rtJson] = await Promise.all([
      owRes.ok ? owRes.json() : Promise.resolve({ success: false }),
      rtRes.ok ? rtRes.json() : Promise.resolve({ success: false }),
    ]);
    const owHit = owJson.success && owJson.data?.length;
    if (!owHit) return null;
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

    console.log(`[sc] ${c.airport} ${yearMonth} → ow=${t.price} rt=${returnPrice ?? 'none'}${returnPriceIsEstimate ? ' (est)' : ''}`);

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

export async function POST(req: Request) {
  const { origin, date } = await req.json();
  const yearMonth = (date as string).slice(0, 7);
  const cacheKey = `sc:${origin}:${yearMonth}`;

  const hit = await getCached(cacheKey);
  if (hit) return new Response(hit, { headers: { 'Content-Type': 'application/json' } });

  const settled = await Promise.all(COUNTRIES.map(c => fetchPrice(origin, date, c)));
  const results = (settled.filter(r => r !== null) as NonNullable<typeof settled[number]>[])
    .sort((a, b) => a.price - b.price)
    .slice(0, 10);

  const text = JSON.stringify(results);
  if (results.length >= 5) {
    await setCached(cacheKey, text);
  } else if (results.length > 0) {
    await setCachedShort(cacheKey, text);
  }
  return new Response(text, { headers: { 'Content-Type': 'application/json' } });
}
