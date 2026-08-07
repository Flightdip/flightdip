import { getCached, setCachedLong } from './cache';

export interface AirportRef {
  city: string;    // Thai city name, e.g. "โตเกียว"
  airport: string; // Thai airport name, e.g. "สนามบินนาริตะ"
}

type RawAirport = {
  code: string;
  name: string | null;
  city_code: string;
  country_code: string;
  flightable: boolean;
  name_translations: { en: string };
};
type RawCity = { code: string; name: string | null };

// Fetches airport→{city,airport} from Travelpayouts Thai data API.
// Cached in Redis for 24h. Only flightable airports are stored.
// Falls back to empty map if fetch fails — callers must handle the fallback.
export async function getAirportCityMap(): Promise<Record<string, AirportRef>> {
  const cacheKey = 'ref:airports:th:v1';

  const hit = await getCached(cacheKey);
  if (hit) {
    try { return JSON.parse(hit) as Record<string, AirportRef>; } catch { /* fall through */ }
  }

  const [airportsRes, citiesRes] = await Promise.all([
    fetch('https://api.travelpayouts.com/data/th/airports.json', { signal: AbortSignal.timeout(15000) }),
    fetch('https://api.travelpayouts.com/data/th/cities.json',   { signal: AbortSignal.timeout(15000) }),
  ]);

  const airports: RawAirport[] = await airportsRes.json();
  const cities: RawCity[]      = await citiesRes.json();

  const cityIndex: Record<string, string> = {};
  for (const c of cities) {
    if (c.code && c.name) cityIndex[c.code] = c.name;
  }

  const result: Record<string, AirportRef> = {};
  for (const a of airports) {
    if (!a.flightable) continue;
    const cityTh    = cityIndex[a.city_code] ?? null;
    const airportTh = a.name ?? null;
    result[a.code] = {
      city:    cityTh    ?? airportTh ?? a.name_translations?.en ?? a.code,
      airport: airportTh ?? cityTh    ?? a.name_translations?.en ?? a.code,
    };
  }

  await setCachedLong(cacheKey, JSON.stringify(result));
  return result;
}
