import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
} as const;

/** Deterministic gradient tint from the initials so avatars feel distinct. */
function tintFor(initials: string) {
  const palette = [
    "from-violet-500/80 to-violet-700/80",
    "from-indigo-500/80 to-violet-600/80",
    "from-sky-500/70 to-violet-600/80",
    "from-fuchsia-500/70 to-violet-700/80",
    "from-blue-500/70 to-indigo-600/80",
  ];
  const sum = initials
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[sum % palette.length];
}

export function Avatar({
  initials,
  size = "md",
  className,
}: {
  initials: string;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-1 ring-white/10",
        tintFor(initials),
        sizeMap[size],
        className
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function AvatarStack({
  items,
  max = 4,
}: {
  items: string[];
  max?: number;
}) {
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((initials, i) => (
        <Avatar
          key={`${initials}-${i}`}
          initials={initials}
          size="sm"
          className="ring-2 ring-card"
        />
      ))}
      {extra > 0 ? (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-[11px] font-medium text-muted ring-2 ring-card">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
