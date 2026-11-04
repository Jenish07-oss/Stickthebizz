import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  stacked?: boolean;
  className?: string;
  href?: string;
}

/**
 * Pixel-perfect SVG Brand Icon for StickTheBizz
 * Features the signature coral squircle with "sb" and the navy stamp dot.
 */
export function LogoIcon({ className = "h-8 w-8", size }: { className?: string; size?: number }) {
  const pixelSize = size || 36;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="StickTheBizz icon"
    >
      {/* Coral Squircle Background */}
      <rect
        x="10"
        y="14"
        width="96"
        height="96"
        rx="30"
        fill="#EE634A"
      />

      {/* Navy Stamp Punch Dot with White Cutout Ring */}
      <circle
        cx="96"
        cy="18"
        r="11"
        fill="#102B4C"
        stroke="#FFFFFF"
        strokeWidth="4"
      />

      {/* Lowercase bold "sb" brand monogram */}
      <text
        x="57"
        y="75"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Plus Jakarta Sans, Inter, system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="44"
        letterSpacing="-1.5px"
      >
        sb
      </text>
    </svg>
  );
}

/**
 * Two-tone Brand Wordmark: "stickthe" in dark navy + "bizz" in coral
 */
export function LogoWordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span
      className={`font-display font-extrabold tracking-tight select-none ${className}`}
    >
      <span className="text-[#102B4C]">stickthe</span>
      <span className="text-[#EE634A]">bizz</span>
    </span>
  );
}

/**
 * Complete StickTheBizz High-Quality Brand Logo
 */
export default function Logo({
  size = "md",
  showWordmark = true,
  stacked = false,
  className = "",
  href,
}: LogoProps) {
  const iconSizes = {
    sm: { icon: 28, text: "text-lg" },
    md: { icon: 34, text: "text-xl" },
    lg: { icon: 44, text: "text-2xl" },
    xl: { icon: 56, text: "text-3xl" },
  };

  const currentSize = iconSizes[size] || iconSizes.md;

  const content = (
    <div
      className={`inline-flex items-center transition-opacity hover:opacity-95 ${
        stacked ? "flex-col text-center gap-2" : "gap-2.5"
      } ${className}`}
    >
      <LogoIcon size={currentSize.icon} />
      {showWordmark && <LogoWordmark className={currentSize.text} />}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="StickTheBizz Home">
        {content}
      </Link>
    );
  }

  return content;
}

