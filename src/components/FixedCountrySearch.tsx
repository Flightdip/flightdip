"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { thaiMonths, countries } from "@/data/mockData";
import { DateFlightResult, COUNTRY_TO_AIRPORT } from "@/lib/flightApi";
import { SearchableSelect, ORIGIN_OPTIONS, SelectOption, SectionLabel, DateFlightCard, CardSkeleton, StepIndicator } from "@/components/shared";

const POPULAR = ["JP", "KR", "SG", "TW", "VN", "MY", "HK", "MV"];

const countryOptions: SelectOption[] = countries.map((c) => ({
  value: c.code,
  label: c.name,
  emoji: c.flag,
  sublabel: c.nameEn,
}));

interface Props {
  initialCountry?: string;
  initialMonth?: string;
}

export default function FixedCountrySearch({ initialCountry = "", initialMonth = "" }: Props) {
  const [origin, setOrigin] = useState("BKK");
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [results, setResults] = useState<DateFlightResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [directOnly, setDirectOnly] = useState(false);
  const [roundTrip, setRoundTrip] = useState(false);

  const currentMonthValue = new Date().toISOString().slice(0, 7);
  const futureMonths = thaiMonths.filter((m) => m.value >= currentMonthValue);
  const years = Array.from(new Set(futureMonths.map((m) => m.year)));

  const selectedCountryData = countries.find((c) => c.code === selectedCountry);
  const destCode = selectedCountry ? COUNTRY_TO_AIRPORT[selectedCountry] : null;
  const selectedMonthLabel = futureMonths.find((m) => m.value === selectedMonth)?.label ?? "";
  const popularCountries = countries.filter((c) => POPULAR.includes(c.code));

  const canSearch = !!selectedCountry && !!selectedMonth && !!destCode;
  const currentStep = selectedMonth ? 3 : selectedCountry ? 2 : 1;

  const displayedResults = (() => {
    let list = directOnly ? results.filter((r) => r.stops === 0) : results;
    if (roundTrip) {
      list = [...list].sort((a, b) => {
        if (!a.returnPrice) return 1;
        if (!b.returnPrice) return -1;
        return (a.returnPrice ?? 0) - (b.returnPrice ?? 0);
      });
    }
    return list;
  })();

  const handleSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setSearched(false);
    setResults([]);

    try {
      const res = await fetch("/api/calendar-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination: destCode, yearMonth: selectedMonth }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      }
    } catch {
      // empty results state handles UX
    }

    setSearched(true);
    setLoading(false);
  };

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
              onChange={setOrigin}
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
                {destCode && <span className="text-emerald-400/70 text-xs">({destCode})</span>}
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
              onClick={() => setRoundTrip(false)}
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
              ไป-กลับ
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              {selectedCountryData && (
                <>
                  <span className="text-4xl">{selectedCountryData.flag}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">วันราคาถูกสุด</p>
                    <h2 className="text-xl font-black text-white">{selectedCountryData.name}</h2>
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
              {/* Cheapest highlight banner */}
              {displayedResults[0] && (
                <div className="mb-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/25 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">วันที่ถูกสุดในเดือนนี้</div>
                    <div className="text-white font-extrabold">
                      {displayedResults[0].displayDate} —{" "}
                      <span className="text-amber-300">
                        ฿{Number(roundTrip && displayedResults[0].returnPrice ? displayedResults[0].returnPrice : displayedResults[0].price).toLocaleString("th-TH")}
                        {roundTrip && displayedResults[0].returnPrice ? " (ไป-กลับ)" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedResults.slice(0, 16).map((result, idx) => (
                  <DateFlightCard key={result.date} result={result} idx={idx} accentColor="emerald" showReturn={roundTrip} />
                ))}
              </div>
            </>
          )}

          {searched && !loading && (
            <p className="text-center text-xs text-slate-500 mt-6">
              พบ {results.length} วัน มีเที่ยวบินใน{selectedMonthLabel} · คลิก &quot;จองเลย&quot; เพื่อดูราคาบน Travelpayouts
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
