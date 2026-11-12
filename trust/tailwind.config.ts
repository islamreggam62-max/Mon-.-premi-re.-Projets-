import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0F172A", soft: "#334155", muted: "#64748B" },
        brand: { DEFAULT: "#1D4ED8", dark: "#1E3A8A", soft: "#EFF6FF" },
      },
    },
  },
  plugins: [],
};

export default config;
