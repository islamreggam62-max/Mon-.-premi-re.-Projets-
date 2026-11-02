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
        // Dark navy surfaces
        base: {
          900: "#060913",
          800: "#0B1120",
          700: "#111827",
        },
        // Electric violet accents (merged with Tailwind's default violet scale)
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
      // System font stack: no network font download, no layout shift.
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      // Tailwind's default scale has no 8 or 12; these back the /8 and /12 modifiers.
      opacity: {
        8: "0.08",
        12: "0.12",
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(124,58,237,0.35), 0 8px 30px -8px rgba(124,58,237,0.45)",
      },
      borderColor: {
        hairline: "rgba(255,255,255,0.10)",
      },
      backgroundColor: {
        hairline: "rgba(255,255,255,0.10)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
