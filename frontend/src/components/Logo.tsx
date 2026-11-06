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

      {/* Lowercase bold "sb" brand monogram — Pure SVG vector paths (Zero font dependency, never collapses into "N") */}
      <path
        d="M 40 60 C 33.5 60 29.5 63.5 29.5 68.5 C 29.5 73.5 33.5 75.8 39 77 C 44 78 46.5 79.2 46.5 82 C 46.5 84.8 43.5 86.5 39 86.5 C 34.5 86.5 31.2 84.2 30.2 80.5 L 24 82.5 C 25.8 88.5 31.5 92 39 92 C 48 92 53.5 87.5 53.5 81.2 C 53.5 74.8 49 72.2 43 71 C 38 69.8 36.2 68.8 36.2 66.5 C 36.2 64.2 38.5 62.8 42 62.8 C 45.8 62.8 48.5 64.5 49.8 67.5 L 55.5 65 C 53.5 61.5 47.8 60 40 60 Z"
        fill="#FFFFFF"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 60 41 L 67 41 L 67 63.2 C 69.5 61.2 73.2 60 77.5 60 C 86.2 60 92 66.5 92 76 C 92 85.5 86.2 92 77.5 92 C 73.2 92 69.5 90.8 67 88.8 L 67 92 L 60 92 Z M 67 76 C 67 81.5 70.8 85.5 76 85.5 C 81.2 85.5 85 81.5 85 76 C 85 70.5 81.2 66.5 76 66.5 C 70.8 66.5 67 70.5 67 76 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export default function Logo({
  size = "md",
  showWordmark = true,
  stacked = false,
  className = "",
  href = "/",
}: LogoProps) {
  const sizeMap = {
    sm: { icon: "h-6 w-6", text: "text-lg", pixelSize: 26 },
    md: { icon: "h-8 w-8", text: "text-xl", pixelSize: 34 },
    lg: { icon: "h-10 w-10", text: "text-2xl", pixelSize: 42 },
    xl: { icon: "h-14 w-14", text: "text-3xl", pixelSize: 56 },
  };

  const { icon, text, pixelSize } = sizeMap[size];

  const content = (
    <div
      className={`inline-flex items-center transition-opacity hover:opacity-95 ${
        stacked ? "flex-col gap-1 text-center" : "gap-2.5"
      } ${className}`}
    >
      <LogoIcon className={icon} size={pixelSize} />

      {showWordmark && (
        <span
          className={`font-display font-extrabold tracking-tight text-[#102B4C] ${text}`}
          style={{ letterSpacing: "-0.03em" }}
        >
          Stick<span className="text-[#EE634A]">The</span>Bizz
        </span>
      )}
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

