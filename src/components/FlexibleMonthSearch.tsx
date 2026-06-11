"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { thaiMonths, CountryResult } from "@/data/mockData";
import { SearchableSelect, ORIGIN_OPTIONS, SectionLabel, CountryCard, CardSkeleton, StepIndicator } from "@/components/shared";

interface Props {
  onPickDates?: (countryCode: string, month: string) => void;
}

export default function FlexibleMonthSearch({ onPickDates }: Props) {
  const [origin, setOrigin] = useState("BKK");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [results, setResults] = useState<CountryResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [directOnly, setDirectOnly] = useState(false);
  const [roundTrip, setRoundTrip] = useState(false);

  const currentMonthValue = new Date().toISOString().slice(0, 7);
  const futureMonths = thaiMonths.filter((m) => m.value >= currentMonthValue);

  const canSearch = !!selectedMonth;
  const currentStep = selectedMonth ? 2 : 1;
  const selectedMonthLabel = futureMonths.find((m) => m.value === selectedMonth)?.label ?? "";
  const years = Array.from(new Set(futureMonths.map((m) => m.year)));

  const displayedResults = (() => {
    let list = directOnly ? results.filter((r) => r.stops === 0) : results;
    if (roundTrip) {
      list = [...list].sort((a, b) => {
        if (!a.returnPrice) return 1;
        if (!b.returnPrice) return -1;
        return a.returnPrice - b.returnPrice;
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
      const res = await fetch("/api/search-countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, date: `${selectedMonth}-01` }),
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
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-500/20 via-blue-600/10 to-indigo-500/20 p-px">
          <div className="absolute inset-0 rounded-2xl bg-[#091628]" />
        </div>
        <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-slate-900 to-[#091628]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />

        <div className="relative p-6 sm:p-7 space-y-8">
          <StepIndicator steps={["เลือกต้นทาง", "เลือกเดือน", "ดูผลลัพธ์"]} current={currentStep} accentColor="sky" />

          {/* Step 1 */}
          <div>
            <SectionLabel step={1} label="บินจากที่ไหน?" accentColor="sky" />
            <SearchableSelect
              options={ORIGIN_OPTIONS}
              value={origin}
              onChange={setOrigin}
              placeholder="เลือกสนามบินต้นทาง..."
              searchPlaceholder="ค้นหาเมือง..."
              accentColor="sky"
            />
          </div>

          {/* Step 2 — Month grid */}
          <div>
            <SectionLabel step={2} label="อยากเดินทางเดือนไหน?" accentColor="sky" />
            <p className="text-xs text-slate-400 mb-4">กดเลือกเดือน — เราจะหาประเทศที่ราคาถูกที่สุดในเดือนนั้น</p>

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
                              ? "bg-gradient-to-br from-sky-500 to-blue-600 border-transparent text-white shadow-lg shadow-sky-500/30"
                              : "bg-white/5 border-white/8 text-slate-300 hover:border-sky-500/40 hover:text-sky-300 hover:bg-sky-500/10"
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
              <div className="mt-4 inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/25 text-sky-300 text-sm font-semibold px-4 py-2.5 rounded-xl">
                <span>📅</span>
                เลือก: {selectedMonthLabel}
              </div>
            )}
          </div>

          {/* เที่ยวเดียว / ไป-กลับ toggle */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setRoundTrip(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                !roundTrip ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              เที่ยวเดียว
            </button>
            <button
              type="button"
              onClick={() => setRoundTrip(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                roundTrip ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "text-slate-400 hover:text-slate-200"
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
                directOnly ? "bg-sky-500 shadow-md shadow-sky-500/30" : "bg-white/15"
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                directOnly ? "left-[26px]" : "left-0.5"
              }`} />
            </button>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={!canSearch || loading}
            className="btn-shimmer w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-extrabold text-base text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-xl shadow-sky-500/25 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={18} />
            )}
            {loading
              ? "กำลังตรวจสอบราคาทุกประเทศ..."
              : !canSearch
              ? "เลือกเดือนก่อนนะ 👆"
              : "ค้นหาประเทศราคาถูก →"}
          </button>

          <p className="text-center text-xs text-slate-500">
            ราคาเริ่มต้น เที่ยวเดียว รวมภาษีและค่าธรรมเนียม · ข้อมูลจาก Travelpayouts
          </p>
        </div>
      </div>

      {/* Results */}
      {(loading || searched) && (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">ผลการค้นหา</p>
              <h2 className="text-xl font-black text-white">
                ประเทศราคาถูกสุด{" "}
                <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">
                  เดือน{selectedMonthLabel.split(" ")[0]}
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm">
              <span className="font-bold text-sky-300">{displayedResults.length} ประเทศ</span>
              <span className="text-slate-400">
                {loading ? "กำลังโหลด..." : roundTrip ? "เรียงราคาไป-กลับ" : directOnly ? "เที่ยวบินตรง" : "เรียงจากถูกไปแพง"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : displayedResults.length === 0 ? (
            <div className="text-center py-10 bg-white/3 border border-white/8 rounded-2xl">
              <div className="text-4xl mb-3">✈️</div>
              <p className="text-sm font-bold text-slate-300 mb-1">
                {directOnly ? "ไม่พบเที่ยวบินตรงในเดือนนี้" : "ไม่พบราคาสำหรับเดือนนี้"}
              </p>
              <p className="text-xs text-slate-500">ลองเปลี่ยนเดือนหรือปิดตัวกรองเที่ยวบินตรง</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedResults.slice(0, 12).map((result, idx) => (
                <CountryCard
                  key={result.code}
                  result={result}
                  idx={idx}
                  accentColor="sky"
                  originCode={origin}
                  showReturn={roundTrip}
                  onPickDates={onPickDates ? () => onPickDates(result.code, selectedMonth) : undefined}
                />
              ))}
            </div>
          )}

          {searched && !loading && (
            <p className="text-center text-xs text-slate-500 mt-6">
              พบ {results.length} จาก 20 ประเทศ · คลิก &quot;ดูวันที่ถูกสุด&quot; เพื่อเลือกวันเดินทาง
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searched && !loading && (
        <div className="text-center py-14 px-4">
          <div className="text-7xl mb-5 animate-drift" style={{ animationDuration: "6s" }}>🌏</div>
          <h3 className="text-xl font-extrabold text-white mb-2">เลือกเดือน แล้วดูประเทศราคาถูก!</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            เราจะค้นหาราคาจริงจาก Travelpayouts สำหรับทุกประเทศ แล้วเรียงจากถูกที่สุด
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {["🇯🇵 ญี่ปุ่น", "🇰🇷 เกาหลี", "🇸🇬 สิงคโปร์", "🇹🇼 ไต้หวัน", "🇻🇳 เวียดนาม"].map((c) => (
              <span key={c} className="bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-sm text-slate-400">{c}</span>
            ))}
            <span className="bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-sm text-slate-500">และอีก 15+ ประเทศ</span>
          </div>
        </div>
      )}
    </div>
  );
}
