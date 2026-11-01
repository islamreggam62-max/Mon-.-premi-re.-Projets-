const STROKE: Record<"violet" | "emerald" | "amber" | "rose", string> = {
  violet: "#8B5CF6",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#F43F5E",
};

export function RingProgress({
  value,
  label,
  caption,
  size = 120,
  stroke = 10,
  tone = "violet",
}: {
  value: number;
  /** Accessible description, e.g. "Daily report submission rate". */
  label: string;
  caption?: string;
  size?: number;
  stroke?: number;
  tone?: keyof typeof STROKE;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={STROKE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="text-2xl font-semibold tabular-nums text-slate-50">{clamped}%</span>
        {caption && <span className="text-[11px] text-slate-400">{caption}</span>}
      </div>
    </div>
  );
}
