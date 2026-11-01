import { useId } from "react";

/** NEXORA mark: a violet tile with a stylised "N" built from two pillars and a diagonal. */
export function BrandMark({ className }: { readonly className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <path
        d="M10 22V10l12 12V10"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLockup() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark className="size-8 drop-shadow-[0_4px_16px_rgb(124_58_237/0.45)]" />
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-[0.18em] text-ink">NEXORA</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-subtle">
          Executive OS
        </span>
      </span>
    </span>
  );
}
