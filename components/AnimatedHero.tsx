"use client";

import React, { useState, useRef } from "react";

interface AnimatedHeroProps {
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedHero({ children, className = "" }: AnimatedHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Subtle 3D parallax tilt for background constellation (desktop only)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((x - centerX) / centerX) * 6; // max 6px
    const tiltY = ((y - centerY) / centerY) * 6;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden bg-sand ${className}`}
    >
      {/* ======================================================== */}
      {/* 1. CONTENTREWARDS-STYLE RADIANT SOLAR GLOW (GOLDEN-AMBER) */}
      {/* ======================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 flex items-center justify-center">
        {/* Core Warm Solar Sunburst Halo */}
        <div
          className="absolute h-[600px] w-[600px] sm:h-[850px] sm:w-[850px] lg:h-[1050px] lg:w-[1050px] rounded-full filter blur-[80px] sm:blur-[110px] opacity-80 transition-transform duration-700 ease-out animate-sun-glow"
          style={{
            background:
              "radial-gradient(circle, rgba(245, 158, 11, 0.38) 0%, rgba(242, 118, 94, 0.25) 40%, rgba(245, 235, 221, 0.08) 68%, transparent 80%)",
            transform: `translate3d(${tilt.x * 0.3}px, ${tilt.y * 0.3}px, 0)`,
          }}
        />

        {/* Ambient Warm Coral Glow (Upper Center) */}
        <div
          className="absolute -top-24 right-1/4 h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] rounded-full bg-[#F2765E]/15 filter blur-[90px] mix-blend-multiply pointer-events-none"
          style={{
            transform: `translate3d(${tilt.x * -0.2}px, ${tilt.y * -0.2}px, 0)`,
          }}
        />
      </div>

      {/* ======================================================== */}
      {/* 2. 3D CELESTIAL WIREFRAME ORBITAL RINGS & CONSTELLATION */}
      {/* (Clean, delicate lines framing the hero canvas gracefully) */}
      {/* ======================================================== */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${tilt.x * 0.5}px, ${tilt.y * 0.5}px, 0)`,
        }}
      >
        <svg
          viewBox="0 0 1200 800"
          className="h-[650px] w-[950px] sm:h-[850px] sm:w-[1250px] lg:h-[1000px] lg:w-[1500px] max-w-none opacity-60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Coral to Amber Gradient for Connecting Curves */}
            <linearGradient id="orbitCoralAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F2765E" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#F2765E" stopOpacity="0.3" />
            </linearGradient>

            {/* Soft Glow Filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Group 1: Subtle Rotating Orbital Ellipses */}
          <g className="origin-center animate-orbit-slow" style={{ transformOrigin: "600px 400px" }}>
            <ellipse
              cx="600"
              cy="400"
              rx="520"
              ry="280"
              stroke="#F2765E"
              strokeOpacity="0.10"
              strokeWidth="1"
              strokeDasharray="6 8"
            />
            <ellipse
              cx="600"
              cy="400"
              rx="440"
              ry="220"
              transform="rotate(-18 600 400)"
              stroke="#F59E0B"
              strokeOpacity="0.09"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <ellipse
              cx="600"
              cy="400"
              rx="360"
              ry="170"
              transform="rotate(22 600 400)"
              stroke="#315B8C"
              strokeOpacity="0.08"
              strokeWidth="1"
              strokeDasharray="5 7"
            />
          </g>

          {/* Group 2: Dynamic Glowing Curved Arc framing the Phone Pass (Right Side) */}
          {/* Arc sweeping over and around the right phone container */}
          <path
            d="M 680 180 C 850 140, 1050 240, 1080 440 C 1100 580, 960 680, 800 660"
            stroke="url(#orbitCoralAmber)"
            strokeWidth="1.75"
            fill="none"
            filter="url(#softGlow)"
          />
          {/* Animated Light Dash traveling along the phone arc */}
          <path
            d="M 680 180 C 850 140, 1050 240, 1080 440 C 1100 580, 960 680, 800 660"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeDasharray="20 180"
            strokeLinecap="round"
            fill="none"
            className="animate-path-pulse"
          />

          {/* Upper Right Glowing Junction Dots */}
          <circle cx="680" cy="180" r="4.5" fill="#F2765E" className="animate-ping" style={{ animationDuration: "3s" }} />
          <circle cx="680" cy="180" r="3.5" fill="#F2765E" />
          <circle cx="1080" cy="440" r="5" fill="#F59E0B" />
          <circle cx="1080" cy="440" r="2.5" fill="#FFFFFF" />
          <circle cx="800" cy="660" r="4" fill="#F2765E" />
        </svg>
      </div>

      {/* ======================================================== */}
      {/* 3. AMBIENT FLOATING RETAIL NODES & MICRO-BADGES */}
      {/* (Carefully placed in negative space around the phone pass) */}
      {/* ======================================================== */}
      <div
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${tilt.x * 0.7}px, ${tilt.y * 0.7}px, 0)`,
        }}
      >
        {/* Node A (Upper Right near Phone Pass): Floating Store Badge */}
        <div
          className="hidden xl:flex absolute top-12 right-[12%] items-center gap-2.5 rounded-2xl bg-white/75 backdrop-blur-md p-2.5 shadow-card border border-white/60 animate-float"
          style={{ animationDelay: "0s" }}
        >
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary text-sm font-bold">
            ☕
          </div>
          <div className="pr-1 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary/70">
              Chai Counter
            </p>
            <p className="font-display text-xs font-bold text-secondary">
              Kesar Chai Corner
            </p>
          </div>
        </div>

        {/* Node B (Floating Orange Pill on Upper Arc): "₹970 Bill Verified" (Matches "$970" in screenshot) */}
        <div
          className="hidden lg:flex absolute top-[14%] right-[28%] xl:right-[30%] items-center gap-1.5 rounded-full bg-primary/95 text-white px-3 py-1 text-[11px] font-mono font-bold shadow-md shadow-primary/20 border border-white/30 backdrop-blur-sm animate-float"
          style={{ animationDelay: "1.2s" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span>₹970 Bill Verified ✓</span>
        </div>

        {/* Node C (Speech Bubble with Tail near Phone Frame): "Just unlocked Free Chai!" */}
        <div
          className="hidden xl:flex absolute bottom-[22%] right-[4%] flex-col items-start rounded-2xl bg-white/85 backdrop-blur-md px-3.5 py-2 shadow-float border border-white/60 animate-float"
          style={{ animationDelay: "2.4s" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🎉</span>
            <p className="font-display text-xs font-bold text-secondary">
              Free Chai Unlocked!
            </p>
          </div>
          <p className="text-[10px] font-mono text-ink/65 mt-0.5">
            10th Daily Visit Verified IST
          </p>
          {/* Subtle Caret / Pointer tail */}
          <div className="absolute -bottom-1.5 left-5 h-3 w-3 rotate-45 bg-white/85 border-r border-b border-white/60" />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. INTERACTIVE MOUSE SPOTLIGHT (FLASHLIGHT EFFECT) */}
      {/* ======================================================== */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: mousePos ? 1 : 0,
          background: mousePos
            ? `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(245, 158, 11, 0.20), rgba(242, 118, 94, 0.10) 45%, transparent 75%)`
            : "transparent",
        }}
      />

      {/* ======================================================== */}
      {/* 5. SUBTLE GRAIN OVERLAY */}
      {/* ======================================================== */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-20 grain" />

      {/* ======================================================== */}
      {/* 6. FOREGROUND CONTENT (CRYSTAL CLEAR & INTERACTIVE) */}
      {/* ======================================================== */}
      <div className="relative z-20">
        {children}
      </div>
    </section>
  );
}
