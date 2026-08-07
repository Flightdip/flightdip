import { getAirportCityMap } from '@/lib/refData';

// All IATA codes used in this app (origins + destinations)
const CURATED = [
  'BKK', 'DMK', 'CNX', 'HKT', 'KBV', 'USM', 'HDY',
  'SIN', 'KUL', 'CGK', 'HAN', 'SGN',
  'NRT', 'HND', 'KIX', 'ICN', 'TPE', 'HKG',
  'MNL', 'PEK', 'PVG', 'DEL', 'LHR', 'CDG', 'FRA',
  'FCO', 'MAD', 'AMS', 'ZRH', 'LAX', 'SYD', 'AKL',
  'DXB', 'IST', 'CMB', 'KTM', 'MLE',
];

// Returns { [iataCode]: { city: string, airport: string } } for curated airports only.
// Clients merge this over the static AIRPORT_CITY_MAP for display enrichment.
export async function GET() {
  try {
    const refData = await getAirportCityMap();
    const result: Record<string, { city: string; airport: string }> = {};
    for (const code of CURATED) {
      if (refData[code]) result[code] = refData[code];
    }
    return Response.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, max-age=86400' },
    });
  } catch {
    return Response.json({});
  }
}
