"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ArrowRight } from "lucide-react";
import { thaiMonths, countries } from "@/data/mockData";
import { DateFlightResult, COUNTRY_TO_AIRPORT } from "@/lib/flightApi";
import { SearchableSelect, ORIGIN_OPTIONS, SelectOption, SectionLabel, DateFlightCard, CardSkeleton, StepIndicator, AIRPORT_CITY_MAP } from "@/components/shared";
import { buildTripComLink, openTripComLink } from "@/lib/tripcom";

const POPULAR = ["JP", "KR", "SG", "TW", "VN", "MY", "HK", "MV"];

// Maps non-Thai origin airports to their country code so we can exclude self-routes
const ORIGIN_TO_COUNTRY_CODE: Record<string, string> = {
  SIN: 'SG', KUL: 'MY', CGK: 'ID', HAN: 'VN', SGN: 'VN',
};


interface Props {
  initialCountry?: string;
  initialMonth?: string;
  initialOrigin?: string;
}

export default function FixedCountrySearch({ initialCountry = "", initialMonth = "", initialOrigin = "" }: Props) {
  const [origin, setOrigin] = useState(initialOrigin || "BKK");
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [results, setResults] = useState<DateFlightResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [directOnly, setDirectOnly] = useState(false);
  const [roundTrip, setRoundTrip] = useState(true);

  // Return calendar state
  const [selectedDeparture, setSelectedDeparture] = useState<DateFlightResult | null>(null);
  const [returnResults, setReturnResults] = useState<DateFlightResult[]>([]);
  const [returnLoading, setReturnLoading] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<DateFlightResult | null>(null);
  const returnSectionRef = useRef<HTMLDivElement>(null);
  const onewayCTARef = useRef<HTMLDivElement>(null);
  const bookingSummaryRef = useRef<HTMLDivElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const resultsCache = useRef<Map<string, DateFlightResult[]>>(new Map());

  const currentMonthValue = new Date().toISOString().slice(0, 7);
  const futureMonths = thaiMonths.filter((m) => m.value >= currentMonthValue);
  const years = Array.from(new Set(futureMonths.map((m) => m.year)));

  const selfCountryCode = ORIGIN_TO_COUNTRY_CODE[origin] ?? null;
  const availableCountries = selfCountryCode
    ? countries.filter((c) => c.code !== selfCountryCode)
    : countries;

  const countryOptions: SelectOption[] = availableCountries.map((c) => ({
    value: c.code,
    label: c.name,
    emoji: c.flag,
    sublabel: c.nameEn,
  }));

  const selectedCountryData = countries.find((c) => c.code === selectedCountry);
  const destCodes = selectedCountry ? (COUNTRY_TO_AIRPORT[selectedCountry] ?? []) : [];
  // Display label: "NRT/HND/KIX" for multi, "ICN" for single, null if none
  const destCodeDisplay = destCodes.length > 0 ? destCodes.join('/') : null;
  const selectedMonthLabel = futureMonths.find((m) => m.value === selectedMonth)?.label ?? "";
  const popularCountries = availableCountries.filter((c) => POPULAR.includes(c.code));

  const canSearch = !!selectedCountry && !!selectedMonth && destCodes.length > 0;
  const currentStep = selectedMonth ? 3 : selectedCountry ? 2 : 1;

  const displayedResults = (() => {
    let list = directOnly ? results.filter((r) => r.stops === 0) : results;
    if (roundTrip) {
      list = [...list].sort((a, b) => {
        const ap = a.returnPrice ?? null;
        const bp = b.returnPrice ?? null;
        if (ap === null && bp === null) return 0;
        if (ap === null) return 1;
        if (bp === null) return -1;
        return ap - bp;
      });
    }
    return list;
  })();

  // Fetch return prices when departure date is selected
  useEffect(() => {
    if (!selectedDeparture || destCodes.length === 0) {
      setReturnResults([]);
      setReturnLoading(false);
      return;
    }

    let cancelled = false;
    const fetchReturn = async () => {
      setReturnLoading(true);
      setSelectedReturn(null);

      const depYM = selectedDeparture.date.slice(0, 7); // YYYY-MM
      const [depYear, depMonth] = depYM.split("-").map(Number);
      const nm = depMonth === 12 ? 1 : depMonth + 1;
      const ny = depMonth === 12 ? depYear + 1 : depYear;
      const nextYM = `${ny}-${String(nm).padStart(2, "0")}`;

      // Use winning airport from selected departure (or primary airport)
      const returnOrigin = selectedDeparture.airportCode ?? destCodes[0];
      // For BKK_ALL, use the departure result's winning origin as the return destination
      const returnDest = selectedDeparture.origin ?? (origin === "BKK_ALL" ? "BKK" : origin);

      try {
        const [r1, r2] = await Promise.all([
          fetch("/api/calendar-prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ origin: returnOrigin, destination: returnDest, yearMonth: depYM }),
          }),
          fetch("/api/calendar-prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ origin: returnOrigin, destination: returnDest, yearMonth: nextYM }),
          }),
        ]);
        const [d1, d2] = await Promise.all([
          r1.ok ? r1.json() : Promise.resolve([]),
          r2.ok ? r2.json() : Promise.resolve([]),
        ]);
        if (!cancelled) {
          const combined = [
            ...(Array.isArray(d1) ? d1 : []),
            ...(Array.isArray(d2) ? d2 : []),
          ]
            .filter((r: DateFlightResult) => r.date > selectedDeparture.date)
            .sort((a: DateFlightResult, b: DateFlightResult) => a.price - b.price);
          setReturnResults(combined);
        }
      } catch {
        if (!cancelled) setReturnResults([]);
      }

      if (!cancelled) setReturnLoading(false);
    };

    fetchReturn();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeparture, selectedCountry, origin]);

  // Scroll to appropriate section after departure date is selected
  useEffect(() => {
    if (!selectedDeparture) return;
    if (roundTrip && returnSectionRef.current) {
      setTimeout(() => returnSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 200);
    } else if (!roundTrip && onewayCTARef.current) {
      setTimeout(() => onewayCTARef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 200);
    }
  }, [selectedDeparture, roundTrip]);

  // Scroll to booking summary after return date is selected (summary is now above return cards — safe to scroll)
  useEffect(() => {
    if (!selectedReturn || !bookingSummaryRef.current) return;
    setTimeout(() => bookingSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [selectedReturn]);


  const handleSearch = async () => {
    if (!canSearch) return;

    const ck = `${origin}|${destCodes.join(',')}|${selectedMonth}`;
    const cached = resultsCache.current.get(ck);
    if (cached) {
      setResults(cached);
      setSearched(true);
      setSelectedDeparture(null);
      setSelectedReturn(null);
      setReturnResults([]);
      setReturnLoading(false);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setLoading(true);
    setSearched(false);
    setResults([]);
    setSelectedDeparture(null);
    setSelectedReturn(null);
    setReturnResults([]);
    setReturnLoading(false);

    try {
      // Build all (originAirport, destAirport) pairs — BKK_ALL × destCodes
      const pairs: Array<[string, string]> = [];
      const origins = origin === "BKK_ALL" ? ["BKK", "DMK"] : [origin];
      for (const orig of origins) {
        for (const dc of destCodes) {
          pairs.push([orig, dc]);
        }
      }

      // Fan out all pairs in parallel
      const settled = await Promise.all(
        pairs.map(([orig, dc]) =>
          fetch("/api/calendar-prices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ origin: orig, destination: dc, yearMonth: selectedMonth }),
            signal: controller.signal,
          })
            .then(r => r.ok ? r.json() : [])
            .catch(() => [])
            .then((data: DateFlightResult[]) =>
              (Array.isArray(data) ? data : []).map(r => ({ ...r, origin: orig, airportCode: dc }))
            )
        )
      );

      if (!controller.signal.aborted) {
        // Merge by date, keeping cheapest across all origin × dest combinations
        const byDate = new Map<string, DateFlightResult>();
        for (const batch of settled) {
          for (const r of batch) {
            const ex = byDate.get(r.date);
            if (!ex || r.price < ex.price) byDate.set(r.date, r);
          }
        }
        const arr = Array.from(byDate.values()).sort((a, b) => a.price - b.price);
        if (arr.length > 0) resultsCache.current.set(ck, arr);
        setResults(arr);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    }

    if (!controller.signal.aborted) {
      setSearched(true);
      setLoading(false);
    }
  };

  const totalPrice =
    selectedDeparture && selectedReturn
      ? selectedDeparture.price + selectedReturn.price
      : null;

  // Effective departure origin: for BKK_ALL, use the result's winning airport (BKK or DMK)
  const effectiveDepOrigin = selectedDeparture?.origin ?? (origin === "BKK_ALL" ? "BKK" : origin);

  // Winning destination airport from the selected departure result
  const destCodeWon = selectedDeparture?.airportCode ?? destCodes[0] ?? null;

  const bookingUrl =
    selectedDeparture && selectedReturn && destCodeWon
      ? buildTripComLink({ origin: effectiveDepOrigin, destination: destCodeWon, departureDate: selectedDeparture.date, returnDate: selectedReturn.date })
      : null;

  return (
    <div className="space-y-6">
      {/* Form card */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-slate-900 to-[#071a18]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
        <div className="absolute inset-0 rounded-2xl border border-white/8" />

        <div className="relative p-6 sm:p-7 space-y-8">
          <StepIndicator
            steps={["เลือกต้นทาง", "เลือกประเทศ", "เลือกเดือน", "ดูผลลัพธ์"]}
            current={currentStep}
            accentColor="emerald"
          />

          {/* Step 1 */}
          <div>
            <SectionLabel step={1} label="บินจากที่ไหน?" accentColor="emerald" />
            <SearchableSelect
              options={ORIGIN_OPTIONS}
              value={origin}
              onChange={(v) => {
                const newSelf = ORIGIN_TO_COUNTRY_CODE[v] ?? null;
                if (newSelf && selectedCountry === newSelf) setSelectedCountry("");
                setOrigin(v);
              }}
              placeholder="เลือกสนามบินต้นทาง..."
              searchPlaceholder="ค้นหาเมือง..."
              accentColor="emerald"
            />
          </div>

          {/* Step 2 */}
          <div>
            <SectionLabel step={2} label="อยากไปประเทศไหน?" accentColor="emerald" />
            <p className="text-xs text-slate-400 mb-4">เลือกปลายทาง — เราจะค้นหาทุกวันในเดือนนั้นแล้วหาวันที่ถูกสุด</p>

            <SearchableSelect
              options={countryOptions}
              value={selectedCountry}
              onChange={setSelectedCountry}
              placeholder="เลือกประเทศปลายทาง..."
              searchPlaceholder="ค้นหาประเทศ เช่น ญี่ปุ่น, Japan..."
              accentColor="emerald"
            />

            {selectedCountry && (
              <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm font-semibold px-4 py-2.5 rounded-xl">
                <span className="text-2xl">{selectedCountryData?.flag}</span>
                เลือก: {selectedCountryData?.name}
                {destCodeDisplay && <span className="text-emerald-400/70 text-xs">({destCodeDisplay})</span>}
              </div>
            )}
          </div>

          {/* Step 3 — Month grid */}
          <div>
            <SectionLabel step={3} label="เดือนที่อยากเดินทาง?" accentColor="emerald" />
            <p className="text-xs text-slate-400 mb-4">เราจะค้นหาราคาทุกวันในเดือนนี้แล้วหาวันที่ถูกสุดให้</p>

            <div className="space-y-5">
              {years.map((year) => (
                <div key={year}>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                    ปี {year + 543}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {futureMonths.filter((m) => m.year === year).map((m) => {
                      const isSelected = selectedMonth === m.value;
                      return (
                        <button
                          key={m.value}
                          onClick={() => setSelectedMonth(m.value)}
                          className={`relative py-3 px-1 rounded-xl text-sm font-bold border transition-all duration-200 active:scale-95 overflow-hidden ${
                            isSelected
                              ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-transparent text-white shadow-lg shadow-emerald-500/30"
                              : "bg-white/5 border-white/8 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 hover:bg-emerald-500/10"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                          )}
                          {m.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {selectedMonth && (
              <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm font-semibold px-4 py-2.5 rounded-xl">
                <span>📅</span>
                เลือก: {selectedMonthLabel}
              </div>
            )}
          </div>

          {/* Trip type toggle */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setRoundTrip(false); setSelectedReturn(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                !roundTrip ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              เที่ยวเดียว
            </button>
            <button
              type="button"
              onClick={() => setRoundTrip(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                roundTrip ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ไป-กลับ (ราคาประมาณ)
            </button>
          </div>

          {/* Direct flights toggle */}
          <div className="flex items-center justify-between bg-white/5 border border-white/8 rounded-xl px-4 py-3">
            <div>
              <div className="text-sm font-bold text-slate-200">เที่ยวบินตรงเท่านั้น</div>
              <div className="text-xs text-slate-500 mt-0.5">ไม่แวะเปลี่ยนเครื่อง (เที่ยวบินตรง)</div>
            </div>
            <button
              type="button"
              onClick={() => setDirectOnly((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ml-4 ${
                directOnly ? "bg-emerald-500 shadow-md shadow-emerald-500/30" : "bg-white/15"
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                directOnly ? "left-[26px]" : "left-0.5"
              }`} />
            </button>
          </div>

          {/* Search */}
          <button
            onClick={handleSearch}
            disabled={!canSearch || loading}
            className="btn-shimmer w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-extrabold text-base text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-xl shadow-emerald-500/25 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={18} />
            )}
            {loading
              ? "กำลังค้นหาทุกวันในเดือนนี้..."
              : !canSearch
              ? "เลือกประเทศและเดือนก่อนนะ 👆"
              : `ค้นหาวันราคาถูกใน${selectedMonthLabel.split(" ")[0] || "เดือนนี้"} →`}
          </button>

          <p className="text-center text-xs text-slate-500">
            ราคาเที่ยวบินไป รวมภาษีและค่าธรรมเนียม · ข้อมูลจาก Travelpayouts
          </p>
        </div>
      </div>

      {/* Results */}
      {(searched || loading) && (
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              {selectedCountryData && (
                <>
                  <span className="text-4xl">{selectedCountryData.flag}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">วันราคาถูกสุด</p>
                    <h2 className="text-xl font-black text-white">
                      {selectedCountryData.name}
                      {destCodeDisplay && <span className="ml-1.5 text-sm font-bold text-slate-500">({destCodeDisplay})</span>}
                    </h2>
                    <p className="text-xs text-slate-400">{selectedMonthLabel}</p>
                  </div>
                </>
              )}
            </div>
            {searched && !loading && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3.5 py-2 text-sm">
                <span className="font-bold text-emerald-300">{displayedResults.length} วัน</span>
                <span className="text-slate-400">{directOnly ? "เที่ยวบินตรง" : "เรียงจากถูกสุด"}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div>
              <div className="text-center text-sm text-slate-400 mb-4">
                กำลังตรวจสอบราคาทุกวันใน{selectedMonthLabel}...
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            </div>
          ) : displayedResults.length === 0 ? (
            <div className="text-center py-10 bg-white/3 border border-white/8 rounded-2xl">
              <div className="text-4xl mb-3">✈️</div>
              <p className="text-sm font-bold text-slate-300 mb-1">
                {directOnly ? "ไม่พบเที่ยวบินตรงในเดือนนี้" : "ไม่พบเที่ยวบินสำหรับเส้นทางนี้"}
              </p>
              <p className="text-xs text-slate-500">ลองเปลี่ยนเดือนหรือปิดตัวกรองเที่ยวบินตรง</p>
            </div>
          ) : (
            <>
              {/* Cheapest outbound banner */}
              {displayedResults[0] && (
                <div className="mb-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/25 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">วันที่ถูกสุดในเดือนนี้</div>
                    <div className="text-white font-extrabold">
                      {displayedResults[0].displayDate} —{" "}
                      <span className="text-amber-300">
                        ฿{Number(roundTrip && displayedResults[0].returnPrice ? displayedResults[0].returnPrice : displayedResults[0].price).toLocaleString("th-TH")}
                        {roundTrip && displayedResults[0].returnPrice ? " (ไป-กลับ โดยประมาณ)" : ""}
                      </span>
                    </div>
                    {displayedResults[0].airportCode && (
                      <div className="text-xs text-amber-300/60 mt-0.5">
                        {displayedResults[0].origin ?? (origin === "BKK_ALL" ? "BKK/DMK" : origin)} → {displayedResults[0].airportCode}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Outbound calendar — tap to select departure */}
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                ✈️ เลือกวันบินไป — แตะวันที่ต้องการ
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedResults.slice(0, 16).map((result, idx) => (
                  <DateFlightCard
                    key={result.date}
                    result={result}
                    idx={idx}
                    accentColor="emerald"
                    showReturn={roundTrip}
                    selected={selectedDeparture?.date === result.date}
                    onSelect={() => setSelectedDeparture(result)}
                  />
                ))}
              </div>

              {/* ── One-way booking CTA (one-way mode, departure selected) ── */}
              {selectedDeparture && !roundTrip && destCodeWon && (() => {
                const onewayUrl = buildTripComLink({ origin: effectiveDepOrigin, destination: destCodeWon, departureDate: selectedDeparture.date });
                return (
                  <div ref={onewayCTARef} className="mt-6 relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-emerald-500/25" />
                    <div className="relative p-5 flex flex-col items-start gap-4">
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <span className="text-2xl">✈️</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-0.5">วันที่เลือก</p>
                          <p className="text-white font-extrabold truncate">{selectedDeparture.displayDate} — ฿{Number(selectedDeparture.price).toLocaleString("th-TH")}</p>
                          <p className="text-xs text-slate-400 mt-0.5">เที่ยวเดียว · สลับเป็น ไป-กลับ เพื่อเลือกวันกลับด้วย</p>
                        </div>
                      </div>
                      <a
                        href={onewayUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        onClick={(e) => {
                          if (/Android/i.test(navigator.userAgent)) {
                            e.preventDefault();
                            openTripComLink(onewayUrl);
                          }
                        }}
                        className="btn-shimmer self-start inline-flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                        style={{ justifyContent: 'flex-start', alignSelf: 'flex-start' }}
                      >
                        ค้นหาบน Trip.com →
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* ── Return calendar (round-trip mode only) ── */}
              {selectedDeparture && roundTrip && (
                <div ref={returnSectionRef} className="mt-8">
                  {/* Section header */}
                  <div className="relative rounded-2xl overflow-hidden mb-5">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent" />
                    <div className="absolute inset-0 rounded-2xl border border-teal-500/20" />
                    <div className="relative px-5 py-4 bg-gradient-to-r from-teal-500/8 to-emerald-500/5 rounded-2xl flex flex-wrap items-center gap-3">
                      <span className="text-2xl">🛬</span>
                      <div>
                        <p className="text-xs font-bold text-teal-300 uppercase tracking-widest">ขั้นตอนที่ 2</p>
                        <h3 className="text-lg font-black text-white">เลือกวันกลับ</h3>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm flex-wrap">
                        <span className="text-emerald-300 font-bold">{selectedDeparture.displayDate}</span>
                        <ArrowRight size={12} className="text-slate-500 flex-shrink-0" />
                        <span className="text-slate-400">
                          {selectedCountryData?.name}
                          {selectedDeparture?.airportCode && <span className="ml-1 text-slate-600 text-xs">({selectedDeparture.airportCode})</span>}
                        </span>
                        <span className="text-slate-600 flex-shrink-0">·</span>
                        <span className="font-bold text-teal-300">฿{Number(selectedDeparture.price).toLocaleString("th-TH")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedDeparture(null); setSelectedReturn(null); setReturnResults([]); }}
                        className="ml-auto text-slate-500 hover:text-slate-300 text-xs font-bold px-2 py-1 rounded-lg hover:bg-white/5 transition-all flex-shrink-0"
                      >
                        ✕ เปลี่ยน
                      </button>
                    </div>
                  </div>

                  {/* ── Booking summary (shown above return cards once return date is selected) ── */}
                  {selectedReturn && totalPrice !== null && bookingUrl && (
                    <div ref={bookingSummaryRef} className="mb-6 relative rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 rounded-2xl" />
                  <div className="absolute inset-0 rounded-2xl border border-emerald-500/30" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                  <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-3xl">✈️</span>
                      <div>
                        <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-0.5">สรุปการเดินทาง</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold text-sm">{selectedDeparture.displayDate}</span>
                          <ArrowRight size={13} className="text-emerald-400 flex-shrink-0" />
                          <span className="text-slate-300 text-sm">
                            {selectedCountryData?.name}
                            {selectedDeparture?.airportCode && <span className="ml-1 text-slate-500 text-xs">({selectedDeparture.airportCode})</span>}
                          </span>
                          <ArrowRight size={13} className="text-teal-400 flex-shrink-0" />
                          <span className="text-white font-bold text-sm">{selectedReturn.displayDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                      <div className="bg-white/5 rounded-xl px-3 py-3 border border-white/8">
                        <div className="text-xs text-slate-400 mb-1">ขาไป</div>
                        <div className="text-xl font-black text-emerald-300">฿{Number(selectedDeparture.price).toLocaleString("th-TH")}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{selectedDeparture.displayDate}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl px-3 py-3 border border-white/8">
                        <div className="text-xs text-slate-400 mb-1">ขากลับ</div>
                        <div className="text-xl font-black text-teal-300">฿{Number(selectedReturn.price).toLocaleString("th-TH")}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{selectedReturn.displayDate}</div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-500/20 to-teal-500/15 rounded-xl px-3 py-3 border border-emerald-500/30">
                        <div className="text-xs text-emerald-300 font-bold mb-1">รวมทั้งหมด</div>
                        <div className="text-2xl font-black text-white">฿{Number(totalPrice).toLocaleString("th-TH")}</div>
                        <div className="text-xs text-emerald-400/70 mt-0.5">ไป + กลับ</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-4">
                      * เที่ยวบินไปและกลับเป็นการจองแยกกัน 2 ตั๋ว ราคาอาจเปลี่ยนแปลงตามความพร้อมที่นั่ง
                    </p>

                    <div className="flex items-start">
                      <a
                        href={bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        onClick={(e) => {
                          if (/Android/i.test(navigator.userAgent)) {
                            e.preventDefault();
                            openTripComLink(bookingUrl);
                          }
                        }}
                        className="btn-shimmer inline-flex items-center gap-2.5 py-4 px-6 rounded-2xl font-extrabold text-base text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 transition-all duration-200 shadow-xl shadow-emerald-500/25 active:scale-[0.98]"
                        style={{ justifyContent: 'flex-start', alignSelf: 'flex-start' }}
                      >
                        ค้นหาราคาบน Trip.com →
                      </a>
                    </div>
                  </div>
                </div>
                  )}

                  {/* Return calendar: loading / empty / cards */}
                  {returnLoading ? (
                    <div>
                      <div className="text-center text-sm text-slate-400 mb-4">
                        กำลังค้นหาราคาเที่ยวบินกลับ {selectedCountryData?.name} → {AIRPORT_CITY_MAP[effectiveDepOrigin] ?? effectiveDepOrigin} ({effectiveDepOrigin})...
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
                      </div>
                    </div>
                  ) : returnResults.length === 0 ? (
                    <div className="text-center py-10 bg-white/3 border border-white/8 rounded-2xl">
                      <div className="text-4xl mb-3">🛬</div>
                      <p className="text-sm font-bold text-slate-300 mb-1">ไม่พบราคาเที่ยวบินกลับในช่วงนี้</p>
                      <p className="text-xs text-slate-500">ลองเลือกวันไปวันอื่น หรือดูราคาบน Trip.com โดยตรง</p>
                    </div>
                  ) : (
                    <>
                      {/* Cheapest return banner */}
                      <div className="mb-4 bg-gradient-to-r from-teal-500/10 to-cyan-500/5 border border-teal-500/25 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <span className="text-2xl">💚</span>
                        <div>
                          <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">วันกลับที่ถูกสุด</div>
                          <div className="text-white font-extrabold">
                            {returnResults[0].displayDate} —{" "}
                            <span className="text-teal-300">฿{Number(returnResults[0].price).toLocaleString("th-TH")}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                        🛬 เลือกวันบินกลับ — แตะวันที่ต้องการ
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {returnResults.slice(0, 16).map((result, idx) => (
                          <DateFlightCard
                            key={result.date}
                            result={result}
                            idx={idx}
                            accentColor="emerald"
                            selected={selectedReturn?.date === result.date}
                            onSelect={() => setSelectedReturn(result)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {searched && !loading && (
            <p className="text-center text-xs text-slate-500 mt-6">
              พบ {results.length} วัน มีเที่ยวบินใน{selectedMonthLabel} · แตะวันที่เพื่อเลือกวันบินไป
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searched && !loading && (
        <div className="text-center py-14 px-4">
          <div className="text-7xl mb-5 animate-drift" style={{ animationDuration: "8s" }}>📍</div>
          <h3 className="text-xl font-extrabold text-white mb-2">เลือกประเทศ + เดือน → ดูวันที่ถูกสุด!</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            เราจะค้นหาราคาทุกวันในเดือนนั้น แล้วเรียงวันที่ถูกสุดไว้ให้ เลือกวันไหนก็ไปจองได้เลย
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {popularCountries.slice(0, 6).map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-2 text-sm font-semibold text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all active:scale-95"
              >
                <span className="text-xl">{c.flag}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
