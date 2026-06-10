"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { countries, generateDateResults, DateResult } from "@/data/mockData";
import { SearchableSelect, ORIGIN_OPTIONS, SelectOption, SectionLabel, StepIndicator } from "@/components/shared";

const POPULAR = ["JP", "KR", "SG", "TW", "VN", "MY", "HK", "MV"];

const countryOptions: SelectOption[] = countries.map((c) => ({
  value: c.code,
  label: c.name,
  emoji: c.flag,
  sublabel: c.nameEn,
}));

export default function FixedCountrySearch() {
  const [origin, setOrigin] = useState("BKK");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [viewYear, setViewYear] = useState(2026);
  const [results, setResults] = useState<DateResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [directOnly, setDirectOnly] = useState(false);

  const thaiMonthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  const dayHeaders = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const canSearch = !!selectedCountry;
  const currentStep = selectedCountry ? 2 : 1;
  const selectedCountryData = countries.find((c) => c.code === selectedCountry);
  const popularCountries = countries.filter((c) => POPULAR.includes(c.code));
  const displayedResults = directOnly ? results.filter((r) => r.stops === 0) : results;

  const ORIGIN_NAMES: Record<string, string> = {
    BKK: "กรุงเทพฯ (BKK)", CNX: "เชียงใหม่ (CNX)", HKT: "ภูเก็ต (HKT)", USM: "สมุย (USM)", HDY: "หาดใหญ่ (HDY)",
  };
  const DEST_AIRPORTS: Record<string, { code: string; name: string }> = {
    JP: { code: "NRT", name: "สนามบินนาริตะ" }, KR: { code: "ICN", name: "สนามบินอินชอน" },
    SG: { code: "SIN", name: "สนามบินชางงี" }, TW: { code: "TPE", name: "สนามบินเถาหยวน" },
    HK: { code: "HKG", name: "สนามบินฮ่องกง" }, MY: { code: "KUL", name: "สนามบินกัวลาลัมเปอร์" },
    VN: { code: "SGN", name: "สนามบินเติ้นเซินเญิ้ต" }, ID: { code: "CGK", name: "สนามบินซูการ์โน-ฮัตตา" },
    PH: { code: "MNL", name: "สนามบินอากีโน" }, CN: { code: "PEK", name: "สนามบินปักกิ่ง" },
    IN: { code: "DEL", name: "สนามบินอินทิรา คานธี" }, EU: { code: "LHR", name: "สนามบินฮีทโธรว์" },
    US: { code: "LAX", name: "สนามบินลอสแองเจลิส" }, AU: { code: "SYD", name: "สนามบินซิดนีย์" },
    NZ: { code: "AKL", name: "สนามบินโอ๊คแลนด์" }, AE: { code: "DXB", name: "สนามบินดูไบ" },
    TR: { code: "IST", name: "สนามบินอิสตันบูล" }, LK: { code: "CMB", name: "สนามบินบันดาราไนเก" },
    NP: { code: "KTM", name: "สนามบินตรีภูวัน" }, MV: { code: "MLE", name: "สนามบินเวลานา" },
  };
  const destAirport = selectedCountry ? DEST_AIRPORTS[selectedCountry] : null;

  const handleSearch = () => {
    if (!canSearch) return;
    setLoading(true);
    setSearched(false);
    setTimeout(() => {
      setResults(generateDateResults(selectedCountry, viewYear, viewMonth));
      setSearched(true);
      setLoading(false);
    }, 900);
  };

  const handleMonthNav = (dir: number) => {
    let m = viewMonth + dir, y = viewYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setViewMonth(m); setViewYear(y);
    if (searched && selectedCountry) {
      setLoading(true);
      setTimeout(() => { setResults(generateDateResults(selectedCountry, y, m)); setLoading(false); }, 400);
    }
  };

  const formatPrice = (p: number) => p.toLocaleString("th-TH");

  const getDateMap = () => {
    const all = generateDateResults(selectedCountry, viewYear, viewMonth);
    const map: Record<number, DateResult> = {};
    all.forEach((r) => { map[parseInt(r.date.split("/")[0])] = r; });
    return map;
  };

  const priceStyle = (price: number, min: number, max: number) => {
    const r = (price - min) / (max - min || 1);
    if (r < 0.25) return { cell: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20", dot: "bg-emerald-400" };
    if (r < 0.6) return { cell: "bg-amber-500/15 text-amber-300 border border-amber-500/20", dot: "bg-amber-400" };
    return { cell: "bg-red-500/15 text-red-400 border border-red-500/20", dot: "bg-red-400" };
  };

  const renderCalendar = () => {
    const dateMap = getDateMap();
    const prices = Object.values(dateMap).map((d) => d.price);
    const minP = Math.min(...prices), maxP = Math.max(...prices);
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const cells: (number | null)[] = [...Array(firstDay).fill(null)];
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div className="bg-gradient-to-b from-slate-900 to-[#091628] border border-white/8 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/5">
          {dayHeaders.map((h, i) => (
            <div key={h} className={`text-center text-xs font-bold py-3 ${i === 0 ? "text-red-400" : i === 6 ? "text-sky-400" : "text-slate-400"}`}>{h}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="border-t border-white/5 min-h-[68px]" />;
            const data = dateMap[day];
            const isWeekend = (i % 7 === 0) || (i % 7 === 6);
            const s = data ? priceStyle(data.price, minP, maxP) : null;
            const dimmed = directOnly && data && data.stops !== 0;
            return (
              <div key={day} className={`border-t border-white/5 p-1.5 min-h-[68px] transition-opacity ${data ? "cursor-pointer hover:bg-white/5 transition-colors" : ""} ${dimmed ? "opacity-25" : ""}`}>
                <div className={`text-xs font-bold mb-1 ${isWeekend ? (i % 7 === 0 ? "text-red-400" : "text-sky-400") : "text-slate-400"}`}>{day}</div>
                {data && s && (
                  <div className={`text-center text-[11px] font-extrabold px-0.5 py-1.5 rounded-lg ${s.cell}`}>
                    ฿{formatPrice(data.price)}
                    {data.stops === 0 && <div className="text-[9px] font-bold opacity-70 leading-none mt-0.5">ตรง</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Form card */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-slate-900 to-[#071a18]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
        <div className="absolute inset-0 rounded-2xl border border-white/8" />

        <div className="relative p-6 sm:p-7 space-y-8">
          <StepIndicator steps={["เลือกต้นทาง", "เลือกประเทศ", "ดูผลลัพธ์"]} current={currentStep} accentColor="emerald" />

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
            <p className="text-xs text-slate-400 mb-4">เลือกปลายทาง — เราจะแสดงวันที่ราคาถูกสุดสำหรับประเทศนั้น</p>

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
              </div>
            )}
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
            {loading ? "กำลังค้นหาวันราคาดีที่สุด..." : !canSearch ? "เลือกประเทศก่อนนะ 👆" : "ดูตารางราคา →"}
          </button>

          <p className="text-center text-xs text-slate-500">
            ราคาเริ่มต้น ไป-กลับ รวมภาษีและค่าธรรมเนียม · ข้อมูลจำลองเพื่อสาธิต
          </p>
        </div>
      </div>

      {/* Results */}
      {(searched || loading) && (
        <div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              {selectedCountryData && (
                <>
                  <span className="text-4xl">{selectedCountryData.flag}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">วันราคาถูก</p>
                    <h2 className="text-xl font-black text-white">{selectedCountryData.name}</h2>
                    {destAirport && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {ORIGIN_NAMES[origin] ?? origin} → {destAirport.name} ({destAirport.code})
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View toggle */}
              <div className="flex bg-white/5 border border-white/8 rounded-xl p-1 gap-0.5">
                {(["list", "calendar"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                      viewMode === mode ? "bg-white/15 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {mode === "list" ? "รายการ" : "ปฏิทิน"}
                  </button>
                ))}
              </div>

              {/* Month nav */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl px-1.5 py-1">
                <button onClick={() => handleMonthNav(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <ChevronLeft size={15} className="text-slate-400" />
                </button>
                <span className="text-xs font-bold text-slate-200 min-w-[100px] text-center">
                  {thaiMonthNames[viewMonth - 1]} {viewYear}
                </span>
                <button onClick={() => handleMonthNav(1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <ChevronRight size={15} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-gradient-to-b from-slate-900 to-[#091628] border border-white/8 rounded-2xl p-10 text-center">
              <div className="w-8 h-8 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">กำลังโหลด...</p>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex items-center gap-5 mb-4 text-xs font-semibold text-slate-400">
                {[["bg-emerald-400", "ราคาถูก"], ["bg-amber-400", "ราคากลาง"], ["bg-red-400", "ราคาแพง"]].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${c} opacity-70 inline-block`} />{l}
                  </span>
                ))}
              </div>

              {viewMode === "calendar" && renderCalendar()}

              {viewMode === "list" && (
                <>
                  {displayedResults.length === 0 ? (
                    <div className="text-center py-10 bg-white/3 border border-white/8 rounded-2xl">
                      <div className="text-4xl mb-3">✈️</div>
                      <p className="text-sm font-bold text-slate-300 mb-1">ไม่พบเที่ยวบินตรงในเดือนนี้</p>
                      <p className="text-xs text-slate-500">ลองปิดตัวกรอง &quot;เที่ยวบินตรง&quot; เพื่อดูเที่ยวบินทั้งหมด</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {displayedResults.slice(0, 15).map((result, idx) => {
                        const ps = results.map((r) => r.price);
                        const s = priceStyle(result.price, Math.min(...ps), Math.max(...ps));
                        const rankBg = ["from-amber-400/10 to-yellow-400/5 border-amber-500/20", "from-slate-400/10 to-slate-300/5 border-slate-500/20", "from-orange-400/10 to-amber-300/5 border-orange-500/20"];
                        const rankText = ["text-amber-300", "text-slate-300", "text-orange-300"];
                        return (
                          <div
                            key={result.date}
                            className="group relative bg-gradient-to-br from-slate-900 to-[#0a1628] border border-white/8 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:border-white/15 transition-all duration-200"
                          >
                            <div className={`h-0.5 ${s.dot} opacity-60`} style={{ background: idx < 3 ? ["#fbbf24", "#94a3b8", "#f97316"][idx] : "" }} />

                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                  {idx < 3 && (
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border bg-gradient-to-br ${rankBg[idx]} ${rankText[idx]}`}>
                                      {idx + 1}
                                    </span>
                                  )}
                                  <div>
                                    <div className="font-extrabold text-white">{result.day} {result.date}</div>
                                    <div className="text-xs text-slate-400">{result.airline}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-black bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                                    ฿{formatPrice(result.price)}
                                  </div>
                                  {result.seatsLeft <= 5 && (
                                    <div className="flex items-center gap-1 text-[11px] text-red-400 font-bold justify-end mt-0.5">
                                      <AlertCircle size={10} />
                                      เหลือ {result.seatsLeft} ที่
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mb-2.5">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  result.stops === 0
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                                    : "bg-amber-500/15 text-amber-300 border-amber-500/25"
                                }`}>
                                  {result.stops === 0 ? "ตรง" : "แวะ 1 จุด"}
                                </span>
                              </div>
                              <button className="btn-shimmer w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 transition-all shadow-md shadow-emerald-500/20">
                                จองเลย →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <p className="text-center text-xs text-slate-500 mt-5">
                แสดง 15 วันที่ราคาถูกสุด · สลับดูด้วยมุมมองปฏิทินได้เลย
              </p>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searched && !loading && (
        <div className="text-center py-14 px-4">
          <div className="text-7xl mb-5 animate-drift" style={{ animationDuration: "8s" }}>📍</div>
          <h3 className="text-xl font-extrabold text-white mb-2">เลือกประเทศปลายทาง</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            รู้แล้วว่าจะไปไหน? เราจะหาวันที่ราคาตั๋วถูกสุดสำหรับประเทศนั้น
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
