export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** Arithmetic mean; null for an empty list rather than NaN. */
export function mean(values: readonly number[]): number | null {
  return values.length > 0 ? sum(values) / values.length : null;
}
