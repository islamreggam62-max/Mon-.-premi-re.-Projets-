import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep dark navy backgrounds
        base: {
          900: "#070B14",
          800: "#0F172A",
          700: "#1E293B",
        },
        // Royal violet accents
        violet: {
          DEFAULT: "#7C3AED",
          soft: "#8B5CF6",
        },
        // Status palette
        status: {
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
          sky: "#38BDF8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(124,58,237,0.35), 0 8px 30px -8px rgba(124,58,237,0.45)",
      },
      borderColor: {
        hairline: "rgba(255,255,255,0.08)",
      },
      backgroundColor: {
        hairline: "rgba(255,255,255,0.04)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
