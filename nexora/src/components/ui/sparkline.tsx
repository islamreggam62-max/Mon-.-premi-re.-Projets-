interface SparklineProps {
  /** Oldest → newest; the last point is the current period. */
  readonly values: readonly number[];
  /** Value range of the y-axis; defaults to [0, max]. */
  readonly domain?: readonly [number, number];
  readonly width?: number;
  readonly height?: number;
}

/**
 * Decorative trend line (aria-hidden; the owning tile describes the trend in
 * text). History in the de-emphasis gray, the current period in the accent,
 * with a surface-colored ring around the end marker.
 */
export function Sparkline({ values, domain, width = 96, height = 28 }: SparklineProps) {
  if (values.length < 2) return null;
  const pad = 6; // end-marker radius (4) + ring (2)
  const [min, max] = domain ?? [0, Math.max(...values)];
  const span = max - min || 1;
  const x = (index: number): number => pad + (index * (width - pad * 2)) / (values.length - 1);
  const y = (value: number): number =>
    pad + (1 - (Math.min(max, Math.max(min, value)) - min) / span) * (height - pad * 2);
  const points = values.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`);
  const last = values.length - 1;
  const lastValue = values[last] ?? 0;
  const previousValue = values[last - 1] ?? 0;

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={points.slice(0, last).join(" ")}
        fill="none"
        stroke="var(--color-mark-muted)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1={x(last - 1)}
        y1={y(previousValue)}
        x2={x(last)}
        y2={y(lastValue)}
        stroke="var(--color-brand-soft)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle
        cx={x(last)}
        cy={y(lastValue)}
        r={4}
        fill="var(--color-brand-soft)"
        stroke="var(--color-surface)"
        strokeWidth={2}
      />
    </svg>
  );
}
