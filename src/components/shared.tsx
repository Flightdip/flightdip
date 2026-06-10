"use client";

import { useState, useRef, useEffect } from "react";
import { Clock, Plane, TrendingDown, TrendingUp, Minus, ChevronDown, Search, Check, ArrowRight } from "lucide-react";
import { CountryResult } from "@/data/mockData";

// ─── Searchable Select ─────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  emoji?: string;
  sublabel?: string;
}

export const ORIGIN_OPTIONS: SelectOption[] = [
  { value: "BKK", label: "กรุงเทพฯ", emoji: "🏙️", sublabel: "สุวรรณภูมิ / ดอนเมือง" },
  { value: "CNX", label: "เชียงใหม่", emoji: "🏔️", sublabel: "ท่าอากาศยานเชียงใหม่" },
  { value: "HKT", label: "ภูเก็ต", emoji: "🏖️", sublabel: "ท่าอากาศยานภูเก็ต" },
  { value: "USM", label: "สมุย", emoji: "🌴", sublabel: "ท่าอากาศยานสมุย" },
  { value: "HDY", label: "หาดใหญ่", emoji: "🌆", sublabel: "ท่าอากาศยานหาดใหญ่" },
];

const ACCENT: Record<string, { triggerOpen: string; item: string; hover: string; check: string }> = {
  sky: {
    triggerOpen: "border-sky-500/50 ring-2 ring-sky-500/20",
    item: "bg-sky-500/15 text-sky-200",
    hover: "hover:bg-sky-500/10 hover:text-sky-100",
    check: "text-sky-400",
  },
  violet: {
    triggerOpen: "border-violet-500/50 ring-2 ring-violet-500/20",
    item: "bg-violet-500/15 text-violet-200",
    hover: "hover:bg-violet-500/10 hover:text-violet-100",
    check: "text-violet-400",
  },
  emerald: {
    triggerOpen: "border-emerald-500/50 ring-2 ring-emerald-500/20",
    item: "bg-emerald-500/15 text-emerald-200",
    hover: "hover:bg-emerald-500/10 hover:text-emerald-100",
    check: "text-emerald-400",
  },
};

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  accentColor?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "เลือก...",
  searchPlaceholder = "ค้นหา...",
  accentColor = "sky",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const ac = ACCENT[accentColor] ?? ACCENT.sky;

  const selected = options.find((o) => o.value === value);

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.includes(query) ||
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sublabel?.toLowerCase().includes(query.toLowerCase()) ?? false) ||
          o.value.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) {
      const t = setTimeout(() => searchRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleToggle = () => {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 300);
    }
    setOpen((prev) => !prev);
    if (open) setQuery("");
  };

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/8 border transition-all duration-200 text-left ${
          open ? ac.triggerOpen : "border-white/10 hover:border-white/20 hover:bg-white/10"
        }`}
      >
        {selected ? (
          <>
            {selected.emoji && (
              <span className="text-xl leading-none flex-shrink-0">{selected.emoji}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm truncate">{selected.label}</div>
              {selected.sublabel && (
                <div className="text-xs text-slate-400 truncate mt-0.5">{selected.sublabel}</div>
              )}
            </div>
          </>
        ) : (
          <span className="flex-1 text-slate-500 text-sm">{placeholder}</span>
        )}
        <ChevronDown
          size={15}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={`absolute left-0 right-0 z-50 bg-[#0d1b35] border border-white/12 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden ${
            openUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {/* Search input */}
          <div className="p-2 border-b border-white/8">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8">
              <Search size={13} className="text-slate-500 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-slate-500 hover:text-slate-300 text-xs leading-none transition-colors w-4 h-4 flex items-center justify-center flex-shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto py-1.5 px-1.5">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                ไม่พบ &quot;{query}&quot;
              </div>
            ) : (
              filtered.map((opt) => {
                const isSel = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-100 ${
                      isSel ? ac.item : `text-slate-200 ${ac.hover}`
                    }`}
                  >
                    {opt.emoji && (
                      <span className="text-xl leading-none flex-shrink-0">{opt.emoji}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-xs text-slate-500 mt-0.5">{opt.sublabel}</div>
                      )}
                    </div>
                    {isSel && <Check size={14} className={`flex-shrink-0 ${ac.check}`} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step Indicator ────────────────────────────────────────────────────────────

const STEP_DONE: Record<string, string> = {
  sky: "bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-md shadow-sky-500/30",
  violet: "bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-md shadow-violet-500/30",
  emerald: "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/30",
};
const STEP_ACTIVE_RING: Record<string, string> = {
  sky: "border-sky-400 text-sky-300 shadow-sm shadow-sky-500/20",
  violet: "border-violet-400 text-violet-300 shadow-sm shadow-violet-500/20",
  emerald: "border-emerald-400 text-emerald-300 shadow-sm shadow-emerald-500/20",
};

interface StepIndicatorProps {
  steps: string[];
  current: number;
  accentColor?: string;
}

export function StepIndicator({ steps, current, accentColor = "sky" }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-300 ${
                  done
                    ? STEP_DONE[accentColor]
                    : active
                    ? `border-2 ${STEP_ACTIVE_RING[accentColor]} bg-white/5`
                    : "border-white/15 text-slate-600 bg-white/3"
                }`}
              >
                {done ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-xs font-semibold transition-colors ${
                  done || active ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <svg
                className="w-3 h-3 text-slate-700 mx-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 12 12"
              >
                <path
                  d="M4 2l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section Label ─────────────────────────────────────────────────────────────

const SECTION_PILL: Record<string, string> = {
  sky: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
};

interface SectionLabelProps {
  step: number;
  label: string;
  accentColor?: string;
}

export function SectionLabel({ step, label, accentColor = "sky" }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black border ${
          SECTION_PILL[accentColor]
        }`}
      >
        {step}
      </span>
      <span className="text-sm font-bold text-slate-200">{label}</span>
    </div>
  );
}

// ─── Origin airport short names ───────────────────────────────────────────────

const ORIGIN_AIRPORTS: Record<string, string> = {
  BKK: "กรุงเทพฯ",
  CNX: "เชียงใหม่",
  HKT: "ภูเก็ต",
  USM: "สมุย",
  HDY: "หาดใหญ่",
};

// ─── Rank badge styles ─────────────────────────────────────────────────────────

const RANK = [
  {
    bar: "from-amber-400 via-yellow-300 to-amber-400",
    badge: "bg-amber-400/15 text-amber-300 border-amber-400/25",
    glow: "shadow-amber-500/20",
    label: "ราคาถูกสุด 🏆",
  },
  {
    bar: "from-slate-400 via-slate-300 to-slate-400",
    badge: "bg-slate-400/15 text-slate-300 border-slate-400/25",
    glow: "shadow-slate-500/15",
    label: "อันดับ 2",
  },
  {
    bar: "from-orange-400 via-amber-300 to-orange-400",
    badge: "bg-orange-400/15 text-orange-300 border-orange-400/25",
    glow: "shadow-orange-500/20",
    label: "อันดับ 3",
  },
];

function TrendBadge({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "down")
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-400">
        <TrendingDown size={10} /> ลง
      </span>
    );
  if (trend === "up")
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-bold text-red-400">
        <TrendingUp size={10} /> ขึ้น
      </span>
    );
  return <Minus size={10} className="text-slate-700" />;
}

// ─── Country Result Card ───────────────────────────────────────────────────────

const CTA_GRAD: Record<string, string> = {
  sky: "from-sky-500 to-blue-600 shadow-sky-500/25",
  violet: "from-violet-500 to-purple-600 shadow-violet-500/25",
  emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
};
const PRICE_COLOR: Record<string, string> = {
  sky: "from-sky-300 to-cyan-200",
  violet: "from-violet-300 to-purple-200",
  emerald: "from-emerald-300 to-teal-200",
};

interface CountryCardProps {
  result: CountryResult;
  idx: number;
  accentColor?: string;
  originCode?: string;
}

export function CountryCard({ result, idx, accentColor = "sky", originCode = "BKK" }: CountryCardProps) {
  const rank = RANK[idx] ?? null;

  return (
    <div
      className={`group relative bg-gradient-to-b from-slate-900 to-[#0a1628] border border-white/8 rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-2 ${
        rank
          ? `hover:shadow-2xl hover:${rank.glow} hover:border-white/15`
          : "hover:shadow-xl hover:border-white/15"
      }`}
    >
      <div
        className={`h-0.5 bg-gradient-to-r ${rank ? rank.bar : "from-transparent via-white/20 to-transparent"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />

      <div className="p-5 flex flex-col flex-1 relative">
        {/* Country + rank */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-5xl leading-none">{result.flag}</span>
            <div>
              <div className="font-extrabold text-white text-lg leading-tight">{result.country}</div>
              <div className="text-sm text-slate-400 font-medium">{result.countryEn}</div>
            </div>
          </div>
          {rank && (
            <span className={`text-[11px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${rank.badge}`}>
              {rank.label}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400 font-medium">ราคาเริ่มต้น ไป-กลับ</span>
            <TrendBadge trend={result.trend} />
          </div>
          <div
            className={`text-4xl font-black bg-gradient-to-r ${PRICE_COLOR[accentColor]} bg-clip-text text-transparent leading-none`}
          >
            ฿{result.price.toLocaleString("th-TH")}
          </div>
        </div>

        {/* Route + stops */}
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 mb-2 border border-white/5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-bold text-slate-300">{originCode}</span>
              <ArrowRight size={9} className="text-slate-500 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-300">{result.airportCode}</span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {ORIGIN_AIRPORTS[originCode] ?? originCode} → {result.airportName} ({result.airportCode})
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
            result.stops === 0
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
              : "bg-amber-500/15 text-amber-300 border-amber-500/25"
          }`}>
            {result.stops === 0 ? "ตรง" : "แวะ 1 จุด"}
          </span>
        </div>

        {/* Airline + duration */}
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 mb-5 border border-white/5">
          <Plane size={13} className="text-slate-500 flex-shrink-0 -rotate-45" />
          <span className="text-sm text-slate-300 font-medium truncate">{result.airline}</span>
          <span className="text-slate-700 mx-0.5 flex-shrink-0">·</span>
          <Clock size={12} className="text-slate-500 flex-shrink-0" />
          <span className="text-sm text-slate-400 flex-shrink-0">{result.duration}</span>
        </div>

        {/* CTA */}
        <button
          className={`btn-shimmer mt-auto w-full py-3.5 rounded-xl font-extrabold text-base text-white bg-gradient-to-r ${CTA_GRAD[accentColor]} hover:opacity-90 active:scale-[0.97] transition-all duration-150 shadow-lg`}
        >
          จองเลย →
        </button>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

export function CardSkeleton() {
  return (
    <div className="bg-gradient-to-b from-slate-900 to-[#0a1628] border border-white/8 rounded-2xl overflow-hidden">
      <div className="h-0.5 bg-white/5" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/8 rounded-xl animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-white/8 rounded w-2/3 animate-pulse" />
            <div className="h-3 bg-white/5 rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="h-10 bg-white/5 rounded-lg w-3/4 animate-pulse" />
        <div className="h-9 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-12 bg-white/8 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
