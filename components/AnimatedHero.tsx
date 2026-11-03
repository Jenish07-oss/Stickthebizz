"use client";

import React, { useState, useRef, useEffect } from "react";

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

    // Subtle 3D parallax tilt for background elements (desktop only)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((x - centerX) / centerX) * 8; // max 8px
    const tiltY = ((y - centerY) / centerY) * 8;
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
          className="absolute h-[600px] w-[600px] sm:h-[900px] sm:w-[900px] lg:h-[1100px] lg:w-[1100px] rounded-full filter blur-[70px] sm:blur-[100px] opacity-90 transition-transform duration-700 ease-out animate-sun-glow"
          style={{
            background:
              "radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(242, 118, 94, 0.32) 38%, rgba(245, 235, 221, 0.12) 68%, transparent 80%)",
            transform: `translate3d(${tilt.x * 0.4}px, ${tilt.y * 0.4}px, 0)`,
          }}
        />

        {/* Ambient Warm Accent Halo (Upper Coral Glow) */}
        <div
          className="absolute -top-32 left-1/4 h-[450px] w-[450px] sm:h-[650px] sm:w-[650px] rounded-full bg-[#F2765E]/20 filter blur-[90px] mix-blend-multiply pointer-events-none"
          style={{
            transform: `translate3d(${tilt.x * -0.3}px, ${tilt.y * -0.3}px, 0)`,
          }}
        />

        {/* Ambient Subtle Cool Steel Blue Grounding (Bottom Right) */}
        <div
          className="absolute -bottom-24 right-10 h-[400px] w-[400px] sm:h-[550px] sm:w-[550px] rounded-full bg-[#315B8C]/15 filter blur-[100px] mix-blend-multiply pointer-events-none"
          style={{
            transform: `translate3d(${tilt.x * 0.2}px, ${tilt.y * 0.2}px, 0)`,
          }}
        />
      </div>

      {/* ======================================================== */}
      {/* 2. 3D CELESTIAL WIREFRAME ORBITAL RINGS & CONNECTING ARCS */}
      {/* ======================================================== */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${tilt.x * 0.6}px, ${tilt.y * 0.6}px, 0)`,
        }}
      >
        <svg
          viewBox="0 0 1000 700"
          className="h-[600px] w-[850px] sm:h-[800px] sm:w-[1100px] lg:h-[950px] lg:w-[1300px] max-w-none opacity-85"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Coral to Amber Gradient for Connecting Curves */}
            <linearGradient id="orbitCoralAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F2765E" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#F2765E" stopOpacity="0.4" />
            </linearGradient>

            {/* Subtle Steel Blue to Coral Gradient */}
            <linearGradient id="orbitSteelCoral" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#315B8C" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#F2765E" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
            </linearGradient>

            {/* Soft Glow Filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Group 1: Rotating Concentric Orbital Ellipses (Wireframe Sphere) */}
          <g className="origin-center animate-orbit-slow" style={{ transformOrigin: "500px 350px" }}>
            {/* Outer Ellipse */}
            <ellipse
              cx="500"
              cy="350"
              rx="460"
              ry="260"
              stroke="#F2765E"
              strokeOpacity="0.18"
              strokeWidth="1.2"
              strokeDasharray="6 8"
            />
            {/* Tilted Ring 1 */}
            <ellipse
              cx="500"
              cy="350"
              rx="400"
              ry="210"
              transform="rotate(-20 500 350)"
              stroke="#F59E0B"
              strokeOpacity="0.16"
              strokeWidth="1.2"
              strokeDasharray="4 6"
            />
            {/* Tilted Ring 2 */}
            <ellipse
              cx="500"
              cy="350"
              rx="330"
              ry="160"
              transform="rotate(25 500 350)"
              stroke="#315B8C"
              strokeOpacity="0.14"
              strokeWidth="1"
              strokeDasharray="5 7"
            />
          </g>

          {/* Group 2: Reverse Rotating Inner Rings for 3D Globe Depth */}
          <g className="origin-center animate-orbit-reverse" style={{ transformOrigin: "500px 350px" }}>
            <ellipse
              cx="500"
              cy="350"
              rx="240"
              ry="110"
              stroke="#F2765E"
              strokeOpacity="0.22"
              strokeWidth="1.4"
              strokeDasharray="3 5"
            />
            <ellipse
              cx="500"
              cy="350"
              rx="150"
              ry="75"
              transform="rotate(-15 500 350)"
              stroke="#F59E0B"
              strokeOpacity="0.25"
              strokeWidth="1.2"
            />
          </g>

          {/* Group 3: Dynamic Curved Glowing Connection Arcs (ContentRewards style) */}
          {/* Arc 1: Left to Center-Top (High-visibility connection arc) */}
          <path
            d="M 180 320 C 260 180, 420 140, 520 220"
            stroke="url(#orbitCoralAmber)"
            strokeWidth="2"
            fill="none"
            filter="url(#softGlow)"
          />
          {/* Traveling Light Dash along Arc 1 */}
          <path
            d="M 180 320 C 260 180, 420 140, 520 220"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeDasharray="18 160"
            strokeLinecap="round"
            fill="none"
            className="animate-path-pulse"
          />

          {/* Arc 2: Center to Right (Linking to Customer Phone Pass) */}
          <path
            d="M 520 220 C 620 280, 740 310, 830 380"
            stroke="url(#orbitCoralAmber)"
            strokeWidth="2"
            fill="none"
            filter="url(#softGlow)"
          />
          {/* Traveling Light Dash along Arc 2 */}
          <path
            d="M 520 220 C 620 280, 740 310, 830 380"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeDasharray="22 180"
            strokeLinecap="round"
            fill="none"
            className="animate-path-pulse"
            style={{ animationDelay: "1.5s" }}
          />

          {/* Arc 3: Bottom Left to Center (Subtle grounding arc) */}
          <path
            d="M 230 460 C 340 520, 510 490, 610 430"
            stroke="url(#orbitSteelCoral)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            fill="none"
          />

          {/* Network Node Dots (Glowing Junctions) */}
          <circle cx="180" cy="320" r="5" fill="#F2765E" className="animate-ping" style={{ animationDuration: "3s" }} />
          <circle cx="180" cy="320" r="4" fill="#F2765E" />
          <circle cx="520" cy="220" r="6" fill="#F59E0B" />
          <circle cx="520" cy="220" r="3" fill="#FFFFFF" />
          <circle cx="830" cy="380" r="5" fill="#F2765E" />
        </svg>
      </div>

      {/* ======================================================== */}
      {/* 3. AMBIENT FLOATING RETAIL NODES & MICRO-BADGES */}
      {/* (Exact layout inspired by ContentRewards.com nodes & $970 pill) */}
      {/* ======================================================== */}
      <div
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${tilt.x * 0.8}px, ${tilt.y * 0.8}px, 0)`,
        }}
      >
        {/* Node A (Upper Left): Floating Store Badge - Kesar Chai Corner */}
        <div
          className="hidden md:flex absolute top-14 left-[6%] lg:left-[10%] items-center gap-2.5 rounded-2xl bg-white/70 backdrop-blur-md p-2.5 shadow-card border border-white/50 animate-float"
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

        {/* Node B (Floating Orange Pill on Arc): "₹970 Bill Verified" (Matches "$970" in screenshot) */}
        <div
          className="absolute top-[22%] left-[45%] md:left-[38%] lg:left-[42%] -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-primary/95 text-white px-3 py-1 text-[11px] font-mono font-bold shadow-md shadow-primary/25 border border-white/30 backdrop-blur-sm animate-float"
          style={{ animationDelay: "1.2s" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span>₹970 Bill Verified ✓</span>
        </div>

        {/* Node C (Speech Bubble with Tail): "Just unlocked Free Chai!" (Matches "Just made my first $1k!") */}
        <div
          className="hidden sm:flex absolute top-[28%] right-[8%] lg:right-[14%] flex-col items-start rounded-2xl bg-white/85 backdrop-blur-md px-3.5 py-2 shadow-float border border-white/60 animate-float"
          style={{ animationDelay: "2.4s" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🎉</span>
            <p className="font-display text-xs font-bold text-secondary">
              Just unlocked Free Masala Chai!
            </p>
          </div>
          <p className="text-[10px] font-mono text-ink/65 mt-0.5">
            10th Daily Visit Verified IST
          </p>
          {/* Subtle Caret / Pointer tail */}
          <div className="absolute -bottom-1.5 left-5 h-3 w-3 rotate-45 bg-white/85 border-r border-b border-white/60" />
        </div>

        {/* Node D (Bottom Left Floating Pill): "Strict 1-Scan Verified" */}
        <div
          className="hidden lg:flex absolute bottom-[18%] left-[8%] items-center gap-2 rounded-full bg-white/70 backdrop-blur-md px-3.5 py-1.5 shadow-sm border border-white/50 text-xs font-semibold text-secondary animate-float"
          style={{ animationDelay: "3.6s" }}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Strict 1-Scan Verified IST</span>
        </div>

        {/* Node E (Bottom Center Floating Pill): "Zero App Store Downloads" */}
        <div
          className="hidden xl:flex absolute bottom-[12%] right-[38%] items-center gap-1.5 rounded-full bg-secondary/10 backdrop-blur-sm px-3 py-1 text-[11px] font-mono font-semibold text-secondary border border-secondary/15 animate-float"
          style={{ animationDelay: "2s" }}
        >
          <span>⚡ No App Downloads</span>
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
            ? `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(245, 158, 11, 0.22), rgba(242, 118, 94, 0.12) 45%, transparent 75%)`
            : "transparent",
        }}
      />

      {/* ======================================================== */}
      {/* 5. SUBTLE GRAIN OVERLAY */}
      {/* ======================================================== */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-25 grain" />

      {/* ======================================================== */}
      {/* 6. FOREGROUND CONTENT (CRYSTAL CLEAR & INTERACTIVE) */}
      {/* ======================================================== */}
      <div className="relative z-20">
        {children}
      </div>
    </section>
  );
}
