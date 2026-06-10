# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js Version Warning

This project uses **Next.js 16.2.7** — a version with breaking changes from what's in your training data. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## Commands

```bash
npm run dev      # Start dev server with Turbopack (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type-check without emitting (no test suite exists)
```

There are no automated tests. Verify changes by running `npx tsc --noEmit` and inspecting the browser.

## Architecture

**flightdip** is a Thai-language flight price comparison UI. Live prices come from the **Travelpayouts Flight Data API** (Aviasales v3) via two Vercel route handlers with Redis caching.

### Three search modes (tabs on the homepage)

| Mode | Component | Accent | API call |
|------|-----------|--------|----------|
| Flexible Month | `FlexibleMonthSearch` | sky/blue | POST `/api/search-countries` with `{ origin, date: "YYYY-MM-01" }` |
| Fixed Dates | `FixedDatesSearch` | violet | POST `/api/search-countries` with `{ origin, date: "YYYY-MM-DD" }` |
| Fixed Country | `FixedCountrySearch` | emerald | POST `/api/search-dates` with `{ origin, destination, yearMonth }` |

The homepage (`src/app/page.tsx`) holds the tab state and renders the active search component. Switching tabs unmounts/remounts, resetting state.

### File structure

```
src/
  app/
    page.tsx                    # Tab controller + hero + mode cards
    layout.tsx                  # Sarabun font (Thai), dark html root, Travelpayouts Drive affiliate script
    globals.css                 # Tailwind v4 import, CSS animations, dark scrollbar
    api/
      search-countries/route.ts # POST: 20 parallel Travelpayouts calls → CountryResult[]
      search-dates/route.ts     # POST: single Travelpayouts call for a month → DateFlightResult[]
      flights/route.ts          # ⚠️ Legacy n8n proxy — not called by any component
  components/
    HeroBackground.tsx          # Animated stars + SVG flight paths (client-only, useEffect)
    shared.tsx                  # SearchableSelect, CountryCard, DateFlightCard, CardSkeleton,
                                #   StepIndicator, SectionLabel, ORIGIN_OPTIONS
    FlexibleMonthSearch.tsx
    FixedDatesSearch.tsx
    FixedCountrySearch.tsx
  data/
    mockData.ts                 # CountryResult/DateResult types, countries[], thaiMonths[]
                                #   generateCountryResults/generateDateResults are unused (superseded by live API)
  lib/
    cache.ts                    # Upstash Redis wrapper: getCached/setCached, 6 h TTL
    flightApi.ts                # ⚠️ Legacy SerpAPI types + COUNTRY_TO_AIRPORT map
                                #   Still imported by FixedCountrySearch for DateFlightResult + COUNTRY_TO_AIRPORT
```

### "use client" everywhere

Every component file has `"use client"` at the top. There are no Server Components. This sidesteps Next.js async Request API breaking changes — don't add Server Components unless you understand the v16 API.

### API layer

Both active routes call `https://api.travelpayouts.com/aviasales/v3/prices_for_dates`. The token is a `TOKEN` constant at the top of each route file.

**`search-countries/route.ts`**
- Fans out 20 parallel `fetch` calls via `Promise.all`, one per country in the embedded `COUNTRIES` array.
- Each call uses `limit=1&one_way=true&currency=thb&departure_at={date}`.
- Filters out countries with no result, sorts by price ascending.
- Returns `{ code, airport, country, countryEn, flag, airportName, price, departure_at, link, googleFlightsUrl }[]`.
- Cache key: `sc:{origin}:{date}`.

**`search-dates/route.ts`**
- Single call with `limit=30&one_way=true&currency=thb&departure_at={yearMonth}`.
- Pre-computes every day in the month from `yearMonth` using `THAI_DAYS` / `THAI_MONTHS_SHORT`.
- Builds a `Map<YYYY-MM-DD, ticket>` from `json.data`, joins against the dates array.
- Returns `{ date, dayOfWeek, displayDate, price, link, googleFlightsUrl }[]` sorted by price.
- Cache key: `sd:{origin}:{destination}:{yearMonth}`.

The `link` field from Travelpayouts is a relative path; both routes prepend `https://www.aviasales.com`. `googleFlightsUrl` is included as an alias of `link` for backward-compat with the `CountryCard`/`DateFlightCard` CTA buttons.

### Type mismatch to be aware of

`CountryResult` in `mockData.ts` declares `airline`, `duration`, `trend`, `stops`, `airportCode` — fields that `search-countries` no longer populates. Components render gracefully with those undefined (blank rows, no crash). Do not add runtime guards for these; fix the type instead if you need those fields.

### Caching (`src/lib/cache.ts`)

Upstash Redis via `@upstash/redis`. Reads `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` from env. If either is absent the layer silently no-ops (dev-friendly). Cache is only written when `results.length > 0` to avoid poisoning on empty API responses. TTL: 6 hours.

### Shared components (`src/components/shared.tsx`)

**`SearchableSelect`** — custom combobox for origin/destination pickers. Props: `options`, `value`, `onChange`, `placeholder`, `searchPlaceholder`, `accentColor` (`"sky" | "violet" | "emerald"`). Supports click-outside close, Escape key, smart up/down positioning.

**`ORIGIN_OPTIONS`** — 5 Thai departure airports as `SelectOption[]`.

**`CountryCard`** — result card with gradient price text, rank badge (top 3), airline/duration row, shimmer CTA. `href` is `result.googleFlightsUrl || '#'`.

### Static data (`src/data/mockData.ts`)

- `countries[]` — 20 entries `{ name, nameEn, code, flag }`. Used only by `FixedCountrySearch` to populate the country picker.
- `thaiMonths[]` — 12 months (Jul 2025–Jun 2026) `{ value, label, short, year }`. Used by month-picker grids in all three modes.

### Styling patterns

- **Tailwind v4** — `@import "tailwindcss"` + `@theme inline` in globals.css. No `tailwind.config.js`.
- **Gradient borders** — `p-px` outer wrapper with gradient background + inner dark `div` (because `border-image` breaks `border-radius`).
- **`btn-shimmer` class** — CSS `::after` with `shimmer-x` animation for button sweep effect.
- **Dark theme** — base bg `#050d1f`, cards `slate-900`/`#0a1628`. Text hierarchy: `text-white` → `text-slate-200` → `text-slate-300` → `text-slate-400` → `text-slate-500`. Avoid `text-white/{opacity}` below `/60`.
- **Stars in HeroBackground** — generated in `useEffect` (not render) to avoid SSR hydration mismatch with `Math.random()`.
- **Date inputs** — `color-scheme: dark` applied globally in globals.css for dark-themed native pickers.

### Accent color system

Each mode passes `"sky"`, `"violet"`, or `"emerald"` through `StepIndicator`, `SectionLabel`, `SearchableSelect`, and `CountryCard`. All use `Record<string, string>` lookup tables keyed by that string.
