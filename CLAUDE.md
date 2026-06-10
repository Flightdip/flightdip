# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js Version Warning

This project uses **Next.js 16.2.7** — a version with breaking changes from what's in your training data. APIs, conventions, and file structure may differ. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## Commands

```bash
npm run dev      # Start dev server with Turbopack (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type-check without emitting (no test suite exists)
```

There are no automated tests. Verify changes by running `npx tsc --noEmit` and inspecting the browser.

## Architecture

**flightdip** is a Thai-language flight price comparison UI. All data is deterministic mock data — no real API calls.

### Three search modes (tabs on the homepage)

| Mode | Component | Accent | What it does |
|------|-----------|--------|--------------|
| Flexible Month | `FlexibleMonthSearch` | sky/blue | Pick a month → ranked list of cheapest countries |
| Fixed Dates | `FixedDatesSearch` | violet | Pick depart + return dates → cheapest countries |
| Fixed Country | `FixedCountrySearch` | emerald | Pick a country → cheapest dates (list or calendar view) |

The homepage (`src/app/page.tsx`) holds the tab state and renders the active search component. Switching tabs unmounts/remounts the component, resetting its state.

### Component structure

```
src/
  app/
    page.tsx          # Tab controller + hero + mode cards
    layout.tsx        # Sarabun font (Thai), dark html root
    globals.css       # Tailwind v4 import, CSS animations, dark scrollbar
  components/
    HeroBackground.tsx      # Animated stars + SVG flight paths (client-only, useEffect)
    shared.tsx              # SearchableSelect, ORIGIN_OPTIONS, StepIndicator,
                            # SectionLabel, CountryCard, CardSkeleton
    FlexibleMonthSearch.tsx
    FixedDatesSearch.tsx
    FixedCountrySearch.tsx
  data/
    mockData.ts       # countries[], thaiMonths[], generateCountryResults(), generateDateResults()
```

### "use client" everywhere

Every component file has `"use client"` at the top. There are no Server Components. This sidesteps Next.js async Request API breaking changes — don't add Server Components unless you understand the v16 API.

### Data layer (`src/data/mockData.ts`)

- `countries[]` — 20 entries with `{ name, nameEn, code, flag }`
- `thaiMonths[]` — 12 months (Jul 2025–Jun 2026) with `{ value, label, short, year }`
- `generateCountryResults(month, departDate?, returnDate?)` — seeded via `Math.sin()` for deterministic prices, returns `CountryResult[]` sorted by price
- `generateDateResults(countryCode, year, month)` — returns `DateResult[]` for every day in a month

Prices are intentionally fake and consistent across page loads (same seed = same price).

### Shared components (`src/components/shared.tsx`)

**`SearchableSelect`** — custom combobox used for both origin city and destination country pickers. Props: `options: SelectOption[]`, `value`, `onChange`, `placeholder`, `searchPlaceholder`, `accentColor` (`"sky" | "violet" | "emerald"`). Supports click-outside close, Escape key, and smart up/down positioning.

**`ORIGIN_OPTIONS`** — the 5 Thai departure airports as `SelectOption[]`.

**`CountryCard`** — result card with gradient price text, rank badge (top 3), airline/duration row, and shimmer CTA button.

### Styling patterns

- **Tailwind v4** — uses `@import "tailwindcss"` and `@theme inline` in globals.css. No `tailwind.config.js`.
- **Gradient borders** — `p-px` outer wrapper with gradient background + inner dark `div`, because `border-image` is incompatible with `border-radius`.
- **`btn-shimmer` class** — CSS `::after` pseudo-element with `shimmer-x` animation for button sweep effect.
- **Dark theme** — base background `#050d1f`, card backgrounds `slate-900` / `#0a1628`. Text hierarchy: `text-white` → `text-slate-200` → `text-slate-300` → `text-slate-400` → `text-slate-500`. Avoid `text-white/{opacity}` below `/60` for readable text.
- **Date inputs** — `color-scheme: dark` applied globally in globals.css so native date pickers inherit the dark theme.
- **Stars in HeroBackground** — generated in `useEffect` (not during render) to avoid SSR hydration mismatch with `Math.random()`.

### Accent color system

Each search mode uses one accent color passed as a string prop (`"sky"`, `"violet"`, `"emerald"`) through `StepIndicator`, `SectionLabel`, `SearchableSelect`, and `CountryCard`. All three components use `Record<string, string>` lookup tables keyed by that string.
