"use client";

import { useLang } from "@/components/lexaudit/LangProvider";
import { RISK_BAND_LABEL, riskBand } from "@/lib/lexaudit/metrics";
import { cn } from "@/lib/utils";

const BAND_COLOR = {
  severe: "#F43F5E",
  high: "#F59E0B",
  moderate: "#8B5CF6",
  low: "#10B981",
} as const;

/**
 * Overall risk indicator drawn as a 180° gauge. The arc fills to `score`/100
 * and is colored by band; the number and band label repeat the value in text,
 * so the meaning never rests on color alone.
 */
export function RiskGauge({ score, size = 200 }: { score: number; size?: number }) {
  const { lang } = useLang();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band = riskBand(clamped);
  const color = BAND_COLOR[band];

  // Semicircle geometry.
  const stroke = Math.round(size * 0.075);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // half circle
  const dash = (clamped / 100) * circumference;

  const height = cy + stroke / 2 + 4;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={height}
        viewBox={`0 0 ${size} ${height}`}
        role="img"
        aria-label={`${clamped} ${lang === "ar" ? "من 100" : lang === "fr" ? "sur 100" : "of 100"} — ${RISK_BAND_LABEL[band][lang]}`}
      >
        {/* Track */}
        <path
          d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Value arc (LTR sweep regardless of document direction) */}
        <path
          d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 700ms ease-out" }}
        />
        <text
          x={cx}
          y={cy - size * 0.05}
          textAnchor="middle"
          className="fill-slate-50 font-semibold"
          style={{ fontSize: size * 0.24, fontVariantNumeric: "tabular-nums" }}
        >
          {clamped}
        </text>
        <text
          x={cx}
          y={cy + size * 0.13}
          textAnchor="middle"
          className="fill-slate-400"
          style={{ fontSize: size * 0.07 }}
        >
          / 100
        </text>
      </svg>
      <span
        className={cn("mt-1 text-sm font-semibold")}
        style={{ color }}
      >
        {RISK_BAND_LABEL[band][lang]}
      </span>
    </div>
  );
}

/** Compact inline risk chip: a tiny bar + number, for tables and lists. */
export function RiskChip({ score }: { score: number }) {
  const { lang } = useLang();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band = riskBand(clamped);
  const color = BAND_COLOR[band];
  return (
    <span className="inline-flex items-center gap-2" title={RISK_BAND_LABEL[band][lang]}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <span className="block h-full rounded-full" style={{ width: `${clamped}%`, background: color }} />
      </span>
      <span className="text-sm font-semibold tabular-nums text-slate-100">{clamped}</span>
    </span>
  );
}
