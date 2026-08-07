"use client";

import { useState } from "react";
import { Plane, Sparkles } from "lucide-react";
import { HeroBackground } from "@/components/HeroBackground";
import FlexibleMonthSearch from "@/components/FlexibleMonthSearch";
import FixedDatesSearch from "@/components/FixedDatesSearch";
import FixedCountrySearch from "@/components/FixedCountrySearch";

type Tab = "flexible" | "fixed-dates" | "fixed-country";

interface Mode {
  id: Tab;
  emoji: string;
  title: string;
  subtitle: string;
  desc: string;
  tag: string;
  gradFrom: string;
  gradTo: string;
  borderGrad: string;
  glowColor: string;
  activeInner: string;
}

const modes: Mode[] = [
  {
    id: "flexible",
    emoji: "🌏",
    title: "ยังไม่รู้จะไปไหน",
    subtitle: "แค่รู้เดือน ก็ค้นหาได้!",
    desc: "เลือกเดือนที่อยากเดินทาง แล้วดูว่าประเทศไหนราคาถูกที่สุด",
    tag: "ยืดหยุ่นตามเดือน",
    gradFrom: "from-sky-400",
    gradTo: "to-blue-600",
    borderGrad: "from-sky-500/40 via-blue-400/20 to-indigo-500/30",
    glowColor: "rgba(56,189,248,0.35)",
    activeInner: "from-sky-950/90 to-blue-950/90",
  },
  {
    id: "fixed-dates",
    emoji: "📅",
    title: "รู้วันไป-กลับแล้ว",
    subtitle: "อยากไปที่ถูกที่สุด?",
    desc: "ใส่วันเดินทางที่แน่นอน แล้วดูว่าไปประเทศไหนได้บ้าง",
    tag: "กำหนดวันที่แน่นอน",
    gradFrom: "from-violet-400",
    gradTo: "to-purple-600",
    borderGrad: "from-violet-500/40 via-purple-400/20 to-pink-500/30",
    glowColor: "rgba(167,139,250,0.35)",
    activeInner: "from-violet-950/90 to-purple-950/90",
  },
  {
    id: "fixed-country",
    emoji: "📍",
    title: "รู้แล้วว่าจะไปไหน",
    subtitle: "อยากไปวันไหนถูกสุด?",
    desc: "เลือกประเทศปลายทาง แล้วดูวันที่ราคาตั๋วดีที่สุด",
    tag: "กำหนดประเทศปลายทาง",
    gradFrom: "from-emerald-400",
    gradTo: "to-teal-600",
    borderGrad: "from-emerald-500/40 via-teal-400/20 to-cyan-500/30",
    glowColor: "rgba(52,211,153,0.35)",
    activeInner: "from-emerald-950/90 to-teal-950/90",
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [deepLinkCountry, setDeepLinkCountry] = useState("");
  const [deepLinkMonth, setDeepLinkMonth] = useState("");
  const [deepLinkOrigin, setDeepLinkOrigin] = useState("");
  const activeMode = modes.find((m) => m.id === activeTab);

  const navigateToCalendar = (countryCode: string, month: string, origin?: string) => {
    setDeepLinkCountry(countryCode);
    setDeepLinkMonth(month);
    setDeepLinkOrigin(origin ?? "");
    setActiveTab("fixed-country");
  };

  return (
    <div className="min-h-screen bg-[#050d1f]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="relative min-h-[380px] sm:min-h-[420px] flex flex-col overflow-hidden">
        <HeroBackground />

        <div className="relative z-10 flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 pt-7 pb-10">

          {/* Logo */}
          <div className="flex items-center justify-between mb-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Plane size={19} className="-rotate-45 text-sky-300" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight leading-none">
                  flight<span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">dip</span>
                </div>
                <div className="text-[10px] text-slate-400 tracking-widest uppercase mt-0.5">เปรียบราคาตั๋วทุกที่</div>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-6">
              {[["20+", "ประเทศ"], ["10+", "สายการบิน"], ["ฟรี", "ใช้ได้เลย"]].map(([v, l]) => (
                <div key={l} className="text-center">
                  <div className="text-base font-black bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">{v}</div>
                  <div className="text-[11px] text-slate-400">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Headline */}
          <div className="mt-10 mb-0">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400/80 tracking-widest uppercase">ค้นหาตั๋วเครื่องบินราคาดี</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight text-white">
              บิน<span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">ถูก</span>{" "}
              เที่ยว<span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">สบาย</span>{" "}
              <span className="inline-block animate-drift" style={{ animationDuration: "5s" }}>✈️</span>
            </h1>
            <p className="mt-3 text-slate-300 text-base sm:text-lg max-w-md font-medium">
              หาตั๋วราคาดีที่สุดจาก 20 ประเทศ ไม่ต้องเปิดหลายเว็บ
            </p>
          </div>
        </div>
      </header>

      {/* ── Mode Selection ────────────────────────────────────── */}
      <div className="relative z-10 -mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Section label */}
          <div className="flex items-center gap-2 mb-4 pl-1">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-sky-400 to-blue-600" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">เลือกวิธีค้นหา</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {modes.map((mode) => {
              const isActive = activeTab === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveTab(mode.id)}
                  className="group text-left focus:outline-none"
                >
                  {/* Gradient border wrapper */}
                  <div
                    className={`relative p-px rounded-2xl transition-all duration-400 ${
                      isActive
                        ? `bg-gradient-to-br ${mode.gradFrom} ${mode.gradTo} shadow-2xl`
                        : `bg-gradient-to-br ${mode.borderGrad} hover:shadow-xl`
                    }`}
                    style={isActive ? { boxShadow: `0 0 40px 8px ${mode.glowColor}` } : undefined}
                  >
                    {/* Inner */}
                    <div
                      className={`rounded-[15px] p-6 h-full transition-all duration-300 ${
                        isActive
                          ? `bg-gradient-to-br ${mode.activeInner} backdrop-blur-sm`
                          : "bg-[#0c1a35] group-hover:bg-[#0e1f3d]"
                      }`}
                    >
                      {/* Checkmark */}
                      {isActive && (
                        <div className={`absolute top-4 right-4 w-5 h-5 rounded-full bg-gradient-to-br ${mode.gradFrom} ${mode.gradTo} flex items-center justify-center shadow-lg`}>
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}

                      {/* Icon with glow */}
                      <div className="relative mb-5 w-fit">
                        <div
                          className={`absolute inset-0 blur-xl rounded-full transition-all duration-500 ${
                            isActive ? "opacity-70 scale-150" : "opacity-0 group-hover:opacity-40 group-hover:scale-125"
                          }`}
                          style={{ background: mode.glowColor }}
                        />
                        <span className="relative text-5xl leading-none">{mode.emoji}</span>
                      </div>

                      {/* Text */}
                      <div className={`font-extrabold text-lg leading-tight mb-1 transition-colors ${isActive ? "text-white" : "text-slate-200 group-hover:text-white"}`}>
                        {mode.title}
                      </div>
                      <div className={`text-sm font-semibold mb-2 transition-colors ${isActive ? "text-white/70" : "text-slate-300 group-hover:text-slate-200"}`}>
                        {mode.subtitle}
                      </div>
                      <div className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                        {mode.desc}
                      </div>

                      {/* Tag pill */}
                      <div
                        className={`mt-4 inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                          isActive
                            ? `bg-gradient-to-r ${mode.gradFrom} ${mode.gradTo} border-transparent text-white`
                            : "border-white/15 text-slate-400 bg-white/5 group-hover:border-white/25 group-hover:text-slate-300"
                        }`}
                      >
                        {mode.tag}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Search Content ────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {activeTab === null && (
          <div className="text-center py-16 px-4">
            {/* Decorative ring */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border border-white/10 animate-ping" style={{ animationDuration: "3s" }} />
              <div className="absolute inset-2 rounded-full border border-white/10" />
              <div className="absolute inset-0 flex items-center justify-center text-5xl">👆</div>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">เริ่มต้นที่นี่</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              เลือกวิธีค้นหาด้านบน แล้วเราจะพาคุณหาตั๋วราคาดีที่สุด
            </p>

            {/* Hint chips */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { e: "🌏", t: "ยังไม่รู้ไปไหน", c: "border-sky-500/30 text-sky-400" },
                { e: "📅", t: "รู้วันแล้ว", c: "border-violet-500/30 text-violet-400" },
                { e: "📍", t: "รู้ประเทศแล้ว", c: "border-emerald-500/30 text-emerald-400" },
              ].map(({ e, t, c }) => (
                <div key={t} className={`flex items-center gap-2 bg-white/5 border rounded-full px-4 py-2 text-sm font-semibold ${c}`}>
                  <span>{e}</span>{t}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab && activeMode && (
          <div>
            {/* Active mode label */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`h-px flex-1 bg-gradient-to-r ${activeMode.gradFrom} ${activeMode.gradTo} opacity-30`} />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${activeMode.gradFrom} ${activeMode.gradTo} text-white text-xs font-bold`}>
                <span>{activeMode.emoji}</span>
                {activeMode.tag}
              </div>
              <div className={`h-px flex-1 bg-gradient-to-l ${activeMode.gradFrom} ${activeMode.gradTo} opacity-30`} />
            </div>

            {activeTab === "flexible" && <FlexibleMonthSearch onPickDates={navigateToCalendar} />}
            {activeTab === "fixed-dates" && <FixedDatesSearch onPickDates={navigateToCalendar} />}
            {activeTab === "fixed-country" && <FixedCountrySearch initialCountry={deepLinkCountry} initialMonth={deepLinkMonth} initialOrigin={deepLinkOrigin} />}
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#040b1a]/80 backdrop-blur-sm mt-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Plane size={13} className="-rotate-45 text-sky-500/60" />
            <span>
              <span className="font-bold text-slate-400">flightdip</span> — ราคาเป็นข้อมูลจำลอง ไม่ใช่ราคาจริง
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            {["เงื่อนไขการใช้งาน", "นโยบายความเป็นส่วนตัว", "ติดต่อเรา"].map((t) => (
              <span key={t} className="hover:text-slate-300 cursor-pointer transition-colors">{t}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
