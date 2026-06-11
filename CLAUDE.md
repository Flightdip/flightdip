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
npx vercel --prod # Deploy to production
```

There are no automated tests. Verify changes by running `npx tsc --noEmit` and inspecting the browser.

## Architecture

**flightdip** is a Thai-language flight price comparison UI. Live prices come from the **Travelpayouts Flight Data API** (Aviasales v3) via three Vercel route handlers with Redis caching.

### Three search modes (tabs on the homepage)

| Mode | Component | Accent | Request payload | API route |
|------|-----------|--------|-----------------|-----------|
| Flexible Month | `FlexibleMonthSearch` | sky | `{ origin, date: "YYYY-MM-01" }` | POST `/api/search-countries` |
| Fixed Dates | `FixedDatesSearch` | violet | `{ origin, date: "YYYY-MM-DD" }` | POST `/api/search-dates` |
| Fixed Country | `FixedCountrySearch` | emerald | `{ origin, destination, yearMonth }` | POST `/api/calendar-prices` |

`page.tsx` holds tab state and renders the active component. Switching tabs unmounts/remounts, resetting all local state.

### File structure

```
src/
  app/
    page.tsx                    # Tab controller + hero + mode cards + cross-tab navigation
    layout.tsx                  # Sarabun font (Thai), dark html root, Travelpayouts Drive affiliate script
    globals.css                 # Tailwind v4 import, CSS animations, dark scrollbar
    api/
      search-countries/route.ts # POST: 20 parallel fan-out calls → top 10 CountryResult[]
      search-dates/route.ts     # POST: 20 parallel fan-out calls for exact date → CountryResult[]
      calendar-prices/route.ts  # POST: single origin→dest month call → DateFlightResult[] per day
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
  lib/
    cache.ts                    # Upstash Redis wrapper: getCached/setCached, 6 h TTL
    flightApi.ts                # ⚠️ Legacy SerpAPI types; still imported for DateFlightResult + COUNTRY_TO_AIRPORT
```

### "use client" everywhere

Every component file has `"use client"` at the top. There are no Server Components. This sidesteps Next.js async Request API breaking changes — don't add Server Components unless you understand the v16 API.

### API layer

All routes call `https://api.travelpayouts.com/aviasales/v3/prices_for_dates`. The token is a `TOKEN` constant at the top of each route file.

**Critical API behavior**: `departure_at=YYYY-MM` (month format) returns results reliably. `departure_at=YYYY-MM-DD` (exact date) returns empty for most future dates — only works when the API has a cached price for that specific day. Design new features accordingly.

**`search-countries/route.ts`** (Feature 1 — Flexible Month)
- Receives `{ origin, date: "YYYY-MM-01" }`, slices to `YYYY-MM` internally.
- Fans out 20 parallel `fetch` calls via `Promise.all`, one per country in the embedded `COUNTRIES` array.
- Each `fetchPrice` makes 2 parallel calls: one-way (`one_way=true`) + round-trip (`return_at=YYYY-MM-01` of following month).
- Returns top 10 sorted by one-way price, each with `returnPrice: number | null`.
- Cache key: `sc:{origin}:{yearMonth}`.

**`search-dates/route.ts`** (Feature 2 — Fixed Dates)
- Identical fan-out pattern but uses the exact `departure_at={date}` (YYYY-MM-DD) the user picks.
- Returns all results (no `.slice(0,10)`), sorted by price.
- Cache key: `sd2:{origin}:{date}`.

**`calendar-prices/route.ts`** (Feature 3 — Fixed Country)
- Single origin→destination pair, one month at a time.
- Two parallel calls: one-way + round-trip (return month = following month's first day).
- Builds a complete dates array for every day in the month, joins API results by `departure_at.slice(0,10)`.
- Returns `DateFlightResult[]` sorted by price, each day with `price`, `returnPrice`, `airline`, `duration`, `stops`, `link`.
- Cache key: `cp:{origin}:{destination}:{yearMonth}`.

The `link` field from Travelpayouts is a relative path; all routes prepend `https://www.aviasales.com`.

### Cross-tab navigation (Feature 1/2 → Feature 3)

`page.tsx` holds `deepLinkCountry` and `deepLinkMonth` state. `navigateToCalendar(countryCode, month)` sets both and switches the active tab to `"fixed-country"`. Since tab switching remounts `FixedCountrySearch`, it reads `initialCountry`/`initialMonth` props from `useState` initial values.

`CountryCard` renders "ดูวันที่ถูกสุด →" (a button, not a link) when the `onPickDates` prop is provided, instead of the usual "จองเลย" booking link.

### Feature 3 return date picker

After the user selects a departure date from the outbound calendar, `FixedCountrySearch` fetches return prices by calling `/api/calendar-prices` twice in parallel (current month + next month) with **origin and destination swapped**. Results are filtered to dates after the departure date and sorted by price. When both a departure and return date are selected, the booking CTA links to:
```
https://www.aviasales.com/search/{origin}{DD}{MM}{dest}{retDD}{retMM}2?adults=1
```

### Round-trip toggle

All three modes have an "เที่ยวเดียว / ไป-กลับ" toggle. For Features 1 & 2, toggling re-sorts `CountryCard` results by `returnPrice` (nulls last) and changes the displayed price label. For Feature 3, it additionally shows `returnPrice` in outbound `DateFlightCard` results; the dedicated return date picker is always available after search regardless of toggle state.

### Caching (`src/lib/cache.ts`)

Upstash Redis via `@upstash/redis`. Reads `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` from env. If either is absent the layer silently no-ops (dev-friendly). Cache is only written when `results.length > 0` to avoid poisoning on empty API responses. TTL: 6 hours.

### Shared components (`src/components/shared.tsx`)

**`SearchableSelect`** — custom combobox. Props: `options`, `value`, `onChange`, `placeholder`, `searchPlaceholder`, `accentColor` (`"sky" | "violet" | "emerald"`). Supports click-outside close, Escape key, smart up/down positioning.

**`ORIGIN_OPTIONS`** — 7 Thai departure airports (BKK, DMK, CNX, HKT, KBV, USM, HDY).

**`CountryCard`** — result card for Features 1/2. Key props: `showReturn` (swap displayed price to `returnPrice`), `onPickDates` (render select button instead of booking link).

**`DateFlightCard`** — result card for Feature 3. Key props: `showReturn`, `selected` (emerald highlight), `onSelect` (render "เลือกวันนี้" button instead of booking link, making the whole card clickable).

### Static data (`src/data/mockData.ts`)

- `countries[]` — 20 entries `{ name, nameEn, code, flag }`. Used by `FixedCountrySearch` country picker and `COUNTRY_TO_AIRPORT` map in `flightApi.ts`.
- `thaiMonths[]` — 12 future months `{ value, label, short, year }`. Used by month-picker grids in all three modes. **Update this array when months become past.**

### Types

`CountryResult` (in `mockData.ts`) and `DateFlightResult` (in `flightApi.ts`) both have `returnPrice?: number | null`. Fields like `airline`, `duration`, `stops`, `airportCode`, `airportName` are optional on `CountryResult` — the API populates them but don't add runtime guards; fix the type if you need them.

### Styling patterns

- **Tailwind v4** — `@import "tailwindcss"` + `@theme inline` in globals.css. No `tailwind.config.js`.
- **Gradient borders** — `p-px` outer wrapper with gradient background + inner dark `div` (because `border-image` breaks `border-radius`).
- **`btn-shimmer` class** — CSS `::after` with `shimmer-x` animation for button sweep effect.
- **Dark theme** — base bg `#050d1f`, cards `slate-900`/`#0a1628`. Text hierarchy: `text-white` → `text-slate-200` → `text-slate-300` → `text-slate-400` → `text-slate-500`.
- **Stars in HeroBackground** — generated in `useEffect` (not render) to avoid SSR hydration mismatch with `Math.random()`.
- **Date inputs** — `color-scheme: dark` applied globally in globals.css for dark-themed native pickers.
- **Accent color system** — each mode passes `"sky"`, `"violet"`, or `"emerald"` through shared components. All use `Record<string, string>` lookup tables keyed by that string.
