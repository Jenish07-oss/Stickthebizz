"use client";

import React, { useState, useRef } from "react";

interface AnimatedHeroProps {
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedHero({ children, className = "" }: AnimatedHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      {/* 1. Animated Mesh Gradient Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {/* Blob 1: Coral (#F2765E) */}
        <div
          className="absolute -top-24 -left-20 h-[500px] w-[500px] sm:h-[650px] sm:w-[650px] rounded-full bg-[#F2765E]/25 mix-blend-multiply filter blur-[120px] animate-blob"
          style={{ animationDelay: "0s" }}
        />

        {/* Blob 2: Navy (#315B8C) */}
        <div
          className="absolute top-1/4 -right-24 h-[460px] w-[460px] sm:h-[600px] sm:w-[600px] rounded-full bg-[#315B8C]/20 mix-blend-multiply filter blur-[120px] animate-blob"
          style={{ animationDelay: "5s" }}
        />

        {/* Blob 3: Warm Sand (#F5EBDD / #E5D9C8 accent) */}
        <div
          className="absolute -bottom-28 left-1/4 h-[520px] w-[520px] sm:h-[680px] sm:w-[680px] rounded-full bg-[#F5EBDD] border-[40px] border-[#E5D9C8]/40 mix-blend-multiply filter blur-[120px] animate-blob"
          style={{ animationDelay: "10s" }}
        />
      </div>

      {/* 2. Interactive Mouse Spotlight (Flashlight Effect) */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: mousePos ? 1 : 0,
          background: mousePos
            ? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(242, 118, 94, 0.20), rgba(49, 91, 140, 0.08) 50%, transparent 80%)`
            : "transparent",
        }}
      />

      {/* 3. Subtle Grain Overlay for Shopify-style Texture */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-30 grain" />

      {/* 4. Foreground Content */}
      <div className="relative z-20">
        {children}
      </div>
    </section>
  );
}
