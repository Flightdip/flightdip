"use client";

import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { CountryResult } from "@/data/mockData";
import { SearchableSelect, ORIGIN_OPTIONS, SectionLabel, CountryCard, CardSkeleton, StepIndicator } from "@/components/shared";

const TOTAL = 20;

interface Props {
  onPickDates?: (countryCode: string, month: string) => void;
}

export default function FixedDatesSearch({ onPickDates }: Props) {
  const [origin, setOrigin] = useState("BKK");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [results, setResults] = useState<CountryResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [directOnly, setDirectOnly] = useState(false);
  const [roundTrip, setRoundTrip] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const canSearch = !!departDate;
  const nights =
    departDate && returnDate
      ? Math.round((new Date(returnDate).getTime() - new Date(departDate).getTime()) / 86400000)
      : null;
  const currentStep = departDate ? 2 : 1;

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
      const res = await fetch("/api/search-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, date: departDate }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently ignore network errors; empty results state handles UX
    }

    setSearched(true);
    setLoading(false);
  };

  const formatDateThai = (d: string) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    const mn = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${parseInt(day)} ${mn[parseInt(m) - 1]} ${parseInt(y) + 543}`;
  };

  return (
    <div className="space-y-6">
      {/* Form card */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1030]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
        <div className="absolute inset-0 rounded-2xl border border-white/8" />

        <div className="relative p-6 sm:p-7 space-y-8">
          <StepIndicator steps={["เลือกต้นทาง", "ใส่วันเดินทาง", "ดูผลลัพธ์"]} current={currentStep} accentColor="violet" />

          {/* Step 1 */}
          <div>
            <SectionLabel step={1} label="บินจากที่ไหน?" accentColor="violet" />
            <SearchableSelect
              options={ORIGIN_OPTIONS}
              value={origin}
              onChange={setOrigin}
              placeholder="เลือกสนามบินต้นทาง..."
              searchPlaceholder="ค้นหาเมือง..."
              accentColor="violet"
            />
          </div>

          {/* Step 2 */}
          <div>
            <SectionLabel step={2} label="เดินทางวันไหน?" accentColor="violet" />
            <p className="text-xs text-slate-400 mb-4">ใส่วันบินไป (จำเป็น) และวันกลับ (ไม่บังคับ) — เราจะหาปลายทางถูกสุดสำหรับวันนั้น</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  ✈️ วันบินไป <span className="text-violet-400">*</span>
                </label>
                <input
                  type="date"
                  value={departDate}
                  min={today}
                  onChange={(e) => {
                    setDepartDate(e.target.value);
                    if (returnDate && e.target.value >= returnDate) setReturnDate("");
                  }}
                  className="w-full px-4 py-4 rounded-xl bg-white/8 border border-white/10 text-white font-semibold text-base focus:outline-none focus:border-violet-500/60 focus:bg-white/12 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  🛬 วันบินกลับ <span className="text-slate-600">(ไม่บังคับ)</span>
                </label>
                <input
                  type="date"
                  value={returnDate}
                  min={departDate || today}
                  disabled={!departDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl bg-white/8 border border-white/10 text-white font-semibold text-base focus:outline-none focus:border-violet-500/60 focus:bg-white/12 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                />
                {!departDate && <p className="text-xs text-slate-500">← เลือกวันไปก่อนนะ</p>}
              </div>
            </div>

            {departDate && (
              <div className="mt-4 flex items-center gap-3 bg-violet-500/10 border border-violet-500/25 rounded-xl px-4 py-3">
                <div className="text-sm font-bold text-violet-200">{formatDateThai(departDate)}</div>
                {returnDate && nights !== null && nights > 0 && (
                  <>
                    <ArrowRight size={14} className="text-violet-400 flex-shrink-0" />
                    <div className="text-sm font-bold text-violet-200">{formatDateThai(returnDate)}</div>
                    <div className="ml-auto text-xs font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/25 px-2.5 py-1 rounded-full flex-shrink-0">
                      {nights} คืน
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Trip type toggle */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setRoundTrip(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                !roundTrip ? "bg-violet-500 text-white shadow-md shadow-violet-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              เที่ยวเดียว
            </button>
            <button
              type="button"
              onClick={() => setRoundTrip(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                roundTrip ? "bg-violet-500 text-white shadow-md shadow-violet-500/30" : "text-slate-400 hover:text-slate-200"
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
                directOnly ? "bg-violet-500 shadow-md shadow-violet-500/30" : "bg-white/15"
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
            className="btn-shimmer w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-extrabold text-base text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-xl shadow-violet-500/25 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={18} />
            )}
            {loading
              ? "กำลังตรวจสอบราคาทุกประเทศ..."
              : !canSearch
              ? "เลือกวันเดินทางก่อนนะ 👆"
              : "ค้นหาประเทศราคาถูก →"}
          </button>

          <p className="text-center text-xs text-slate-500">
            ราคาเที่ยวบินไป รวมภาษีและค่าธรรมเนียม · ข้อมูลจาก Travelpayouts
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
                ประเทศ<span className="bg-gradient-to-r from-violet-300 to-purple-200 bg-clip-text text-transparent">ราคาถูกสุด</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm flex-wrap">
              <span className="font-bold text-violet-300">{formatDateThai(departDate)}</span>
              {returnDate && nights !== null && nights > 0 && (
                <>
                  <ArrowRight size={12} className="text-slate-600" />
                  <span className="font-bold text-violet-300">{formatDateThai(returnDate)}</span>
                  <span className="text-slate-400">· {nights} คืน</span>
                </>
              )}
              {directOnly && (
                <span className="text-[11px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/25 px-2 py-0.5 rounded-full">
                  เที่ยวบินตรง
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : displayedResults.length === 0 ? (
            <div className="text-center py-10 bg-white/3 border border-white/8 rounded-2xl">
              <div className="text-4xl mb-3">✈️</div>
              <p className="text-sm font-bold text-slate-300 mb-1">
                {directOnly ? "ไม่พบเที่ยวบินตรงในวันนี้" : "ไม่พบราคาสำหรับวันที่เลือก"}
              </p>
              <p className="text-xs text-slate-500">ลองเปลี่ยนวันหรือปิดตัวกรองเที่ยวบินตรง</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedResults.slice(0, 12).map((result, idx) => (
                <CountryCard
                  key={result.code}
                  result={result}
                  idx={idx}
                  accentColor="violet"
                  originCode={origin}
                  showReturn={roundTrip}
                  onPickDates={onPickDates ? () => onPickDates(result.code, departDate.slice(0, 7)) : undefined}
                />
              ))}
            </div>
          )}

          {searched && !loading && (
            <p className="text-center text-xs text-slate-500 mt-6">
              พบ {results.length} จาก {TOTAL} ประเทศ · คลิก &quot;จองเลย&quot; เพื่อดูราคาบน Travelpayouts
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searched && !loading && (
        <div className="text-center py-14 px-4">
          <div className="text-7xl mb-5 animate-drift" style={{ animationDuration: "7s" }}>📅</div>
          <h3 className="text-xl font-extrabold text-white mb-2">บอกวันที่ แล้วดูว่าไปไหนได้บ้าง!</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            ใส่วันเดินทาง เราจะค้นหาราคาจริงจาก Travelpayouts และเรียงประเทศที่ถูกสุดให้ดูทันที
          </p>
          <div className="mt-7 grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {[
              { e: "✈️", t: "วันบินไป" },
              { e: "🛬", t: "วันกลับ (ไม่บังคับ)" },
              { e: "🔍", t: "ดูราคาจริง" },
            ].map((s) => (
              <div key={s.t} className="bg-white/5 border border-white/8 rounded-2xl p-4 text-center">
                <div className="text-3xl mb-1">{s.e}</div>
                <div className="text-xs font-bold text-slate-400">{s.t}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
