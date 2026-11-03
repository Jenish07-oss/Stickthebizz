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
      },
      keyframes: {
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
      },
      animation: {
        float: "float 3.5s ease-in-out infinite",
        "stamp-pop": "stampPop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "flame-pulse": "flameGlow 2s ease-in-out infinite",
        "bell-ring": "bellRing 0.6s ease-in-out",
        marquee: "marquee 25s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
