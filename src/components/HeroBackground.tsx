"use client";

import { useEffect, useState } from "react";

interface Star {
  x: number; y: number; r: number; delay: number; dur: number; bright: boolean;
}

export function HeroBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 110 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.4 + 0.4,
        delay: Math.random() * 6,
        dur: Math.random() * 3 + 2.5,
        bright: Math.random() > 0.8,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Deep space gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060d22] via-[#080f28] to-[#050d1f]" />

      {/* Stars */}
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r * 2,
            height: s.r * 2,
            background: s.bright
              ? "radial-gradient(circle, #e0f2fe 0%, #7dd3fc 60%, transparent 100%)"
              : "radial-gradient(circle, #f8fafc 0%, #cbd5e1 70%, transparent 100%)",
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
            boxShadow: s.bright ? `0 0 ${s.r * 3}px rgba(125,211,252,0.8)` : "none",
          }}
        />
      ))}

      {/* Flight path SVG */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1400 360"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="fp1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="30%" stopColor="#60a5fa" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fp2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
            <stop offset="50%" stopColor="#a5b4fc" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fp3" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
            <stop offset="40%" stopColor="#fbbf24" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Path 1: Bangkok → Tokyo arc */}
        <path
          d="M -80,280 C 120,220 280,260 500,180 S 780,160 1100,110 S 1350,80 1500,70"
          fill="none" stroke="url(#fp1)" strokeWidth="1.5"
          strokeDasharray="8 5" className="animate-dash-1"
        />
        {/* Path 2: Lower arc */}
        <path
          d="M -50,340 C 200,280 380,310 620,240 S 900,220 1200,170 S 1400,150 1500,145"
          fill="none" stroke="url(#fp2)" strokeWidth="1"
          strokeDasharray="5 8" className="animate-dash-2"
        />
        {/* Path 3: Gold accent, right to left */}
        <path
          d="M 1480,220 C 1200,180 900,200 650,160 S 300,120 0,100"
          fill="none" stroke="url(#fp3)" strokeWidth="1"
          strokeDasharray="6 6" className="animate-dash-3"
        />

        {/* Plane dot on path 1 */}
        <g filter="url(#glow-blue)">
          <circle r="3.5" fill="#60a5fa">
            <animateMotion
              dur="20s"
              repeatCount="indefinite"
              path="M -80,280 C 120,220 280,260 500,180 S 780,160 1100,110 S 1350,80 1500,70"
            />
          </circle>
        </g>
        {/* Second plane on gold path */}
        <circle r="2.5" fill="#fbbf24" opacity="0.8">
          <animateMotion
            dur="28s"
            repeatCount="indefinite"
            begin="-14s"
            path="M 1480,220 C 1200,180 900,200 650,160 S 300,120 0,100"
          />
        </circle>
      </svg>

      {/* Bottom glow — city lights */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-blue-950/40 to-transparent" />

      {/* Center radial glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full animate-glow-breathe"
        style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)" }}
      />

      {/* Top-right accent nebula */}
      <div
        className="absolute -top-20 right-0 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }}
      />
    </div>
  );
}
