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
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        stampPop: {
          "0%": { transform: "scale(0.4)", opacity: "0.2" },
          "70%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "stamp-pop": "stampPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "pulse-slow": "pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        marquee: "marquee 25s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
