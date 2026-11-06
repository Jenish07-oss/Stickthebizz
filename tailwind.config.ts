import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F5EBDD",
        sand: "#F5EBDD",
        primary: "#F2765E",
        coral: "#F2765E",
        secondary: "#315B8C",
        steel: "#315B8C",
        ink: "#413333",
        surface: "#FFFFFF",
        border: "#E5D9C8",
        success: "#16A34A",
        warning: "#F59E0B",
        "brand-dark": "#1A2A3A",
        "brand-dark-text": "#F5EBDD",
        "brand-dark-muted": "#D4C8B8",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        float: "0 20px 45px rgba(65, 51, 51, 0.10)",
        card: "0 10px 30px rgba(65, 51, 51, 0.08)",
        phone: "0 25px 50px rgba(49, 91, 140, 0.22)",
        flame: "0 0 20px rgba(242, 118, 94, 0.55)",
        "brand-sm": "var(--shadow-coral-1) 0 3px 6px, var(--shadow-ink-1) 0 1px 2px",
        "brand-md": "var(--shadow-coral-2) 0 15px 35px, var(--shadow-ink-1) 0 8px 16px",
        "brand-lg": "var(--shadow-coral-3) 0 30px 45px -20px, var(--shadow-ink-1) 0 18px 36px -18px",
        "brand-xl": "var(--shadow-coral-4) 0 14px 21px -14px, var(--shadow-ink-1) 0 8px 17px -8px",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1) rotate(0deg)",
          },
          "33%": {
            transform: "translate(40px, -60px) scale(1.15) rotate(120deg)",
          },
          "66%": {
            transform: "translate(-30px, 30px) scale(0.9) rotate(240deg)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1) rotate(360deg)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        stampPop: {
          "0%": { transform: "scale(0.3) rotate(-15deg)", opacity: "0" },
          "60%": { transform: "scale(1.25) rotate(5deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        flameGlow: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(242, 118, 94, 0.4)" },
          "50%": { boxShadow: "0 0 24px rgba(242, 118, 94, 0.75)" },
        },
        bellRing: {
          "0%": { transform: "rotate(0)" },
          "20%": { transform: "rotate(-15deg)" },
          "40%": { transform: "rotate(12deg)" },
          "60%": { transform: "rotate(-8deg)" },
          "80%": { transform: "rotate(4deg)" },
          "100%": { transform: "rotate(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        laserSweep: {
          "0%": { top: "0%", opacity: "0.2" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { top: "100%", opacity: "0.2" },
        },
        orbitSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        orbitReverse: {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        sunGlow: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        pathPulse: {
          "0%": { strokeDashoffset: "200" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        blob: "blob 15s ease-in-out infinite",
        float: "float 3.5s ease-in-out infinite",
        "float-slow": "float 5s ease-in-out infinite",
        "stamp-pop": "stampPop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "flame-pulse": "flameGlow 2s ease-in-out infinite",
        "bell-ring": "bellRing 0.6s ease-in-out",
        marquee: "marquee 25s linear infinite",
        "laser-sweep": "laserSweep 1s ease-in-out forwards",
        "orbit-slow": "orbitSlow 80s linear infinite",
        "orbit-reverse": "orbitReverse 100s linear infinite",
        "sun-glow": "sunGlow 8s ease-in-out infinite",
        "path-pulse": "pathPulse 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
