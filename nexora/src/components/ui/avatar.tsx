import { cn } from "@/lib/cn";

const SIZES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
} as const;

interface AvatarProps {
  readonly initials: string;
  /** When given, the avatar is announced; otherwise it is decorative. */
  readonly name?: string;
  readonly size?: keyof typeof SIZES;
  readonly className?: string;
}

export function Avatar({ initials, name, size = "md", className }: AvatarProps) {
  return (
    <span
      {...(name ? { role: "img", "aria-label": name, title: name } : { "aria-hidden": true })}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-brand-soft/15 font-semibold text-brand-ink-strong ring-1 ring-brand-soft/25",
        SIZES[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}

interface AvatarStackProps {
  readonly people: readonly { readonly name: string; readonly initials: string }[];
  readonly max?: number;
  readonly label: string;
}

export function AvatarStack({ people, max = 4, label }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const hidden = people.length - shown.length;
  return (
    <div className="flex items-center" role="group" aria-label={`${label}: ${people.map((p) => p.name).join(", ")}`}>
      {shown.map((person) => (
        <Avatar
          key={person.name}
          initials={person.initials}
          size="sm"
          className="-ml-1.5 ring-2 ring-surface first:ml-0"
        />
      ))}
      {hidden > 0 ? (
        <span
          aria-hidden="true"
          className="-ml-1.5 inline-flex size-6 items-center justify-center rounded-full bg-raised text-[10px] font-semibold text-ink-muted ring-2 ring-surface"
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  );
}
