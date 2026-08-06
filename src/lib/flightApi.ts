import { countries, CountryResult } from '@/data/mockData';

export const COUNTRY_TO_AIRPORT: Record<string, string> = {
  JP: 'NRT', KR: 'ICN', SG: 'SIN', TW: 'TPE', HK: 'HKG',
  MY: 'KUL', VN: 'SGN', ID: 'CGK', PH: 'MNL', CN: 'PEK',
  IN: 'DEL', EU: 'LHR', US: 'LAX', AU: 'SYD', NZ: 'AKL',
  AE: 'DXB', TR: 'IST', LK: 'CMB', NP: 'KTM', MV: 'MLE',
};

export interface FlightLeg {
  departure_airport: { name: string; id: string; time: string };
  arrival_airport:   { name: string; id: string; time: string };
  duration: number;
  airline: string;
  airline_logo: string;
  flight_number: string;
  airplane: string;
  legroom?: string;
  extensions?: string[];
}

export interface FlightOption {
  flights: FlightLeg[];
  total_duration: number;
  price: number;
  type: string;
  airline_logo: string;
  booking_token: string;
  carbon_emissions?: { this_flight: number; typical_for_this_route: number; difference_percent: number };
}

export interface SearchResponse {
  best_flights?: FlightOption[];
  other_flights?: FlightOption[];
  price_insights?: { price_level?: string; typical_price_range?: number[]; lowest_price?: number };
  search_metadata?: { google_flights_url: string };
  search_information?: { flights_results_state: string };
  error?: string;
}

export interface DateFlightResult {
  date: string;
  dayOfWeek: string;
  displayDate: string;
  price: number;
  airline?: string;
  airlineLogo?: string | null;
  duration?: string;
  stops?: 0 | 1;
  googleFlightsUrl?: string;
  link?: string;
  returnPrice?: number | null;
  returnPriceIsEstimate?: boolean;
  origin?: string;
}

export function minutesToThai(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}ช. ${m}น.` : `${h}ช.`;
}

function toTrend(level?: string): 'up' | 'down' | 'stable' {
  if (level === 'low') return 'down';
  if (level === 'high') return 'up';
  return 'stable';
}

export async function searchRoute(
  origin: string,
  destination: string,
  date: string,
): Promise<SearchResponse | null> {
  try {
    const res = await fetch('/api/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, date }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const raw = await res.json();
    const data: SearchResponse = Array.isArray(raw) ? raw[0] : raw;
    if (!data || data.error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function fetchCountryResult(
  origin: string,
  countryCode: string,
  date: string,
): Promise<CountryResult | null> {
  const destCode = COUNTRY_TO_AIRPORT[countryCode];
  if (!destCode) return null;
  const country = countries.find((c) => c.code === countryCode);
  if (!country) return null;

  const data = await searchRoute(origin, destCode, date);
  if (!data) return null;

  const all = [...(data.best_flights ?? []), ...(data.other_flights ?? [])];
  if (all.length === 0) return null;

  const cheapest = all.reduce((a, b) => (a.price < b.price ? a : b));
  const lastLeg  = cheapest.flights[cheapest.flights.length - 1];

  return {
    country:     country.name,
    countryEn:   country.nameEn,
    code:        countryCode,
    flag:        country.flag,
    price:       cheapest.price,
    airline:     cheapest.flights[0].airline,
    duration:    minutesToThai(cheapest.total_duration),
    trend:       toTrend(data.price_insights?.price_level),
    stops:       Math.min(cheapest.flights.length - 1, 1) as 0 | 1,
    airportCode: lastLeg.arrival_airport.id,
    airportName: lastLeg.arrival_airport.name,
  };
}
