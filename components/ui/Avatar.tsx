import { cn } from "@/lib/utils";
import type { Person } from "@/lib/types";

type AvatarPerson = Pick<Person, "id" | "initials" | "name">;

const GRADIENTS = [
  "from-violet to-fuchsia-500",
  "from-sky-500 to-cyan-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
  "from-indigo-500 to-violet-500",
];

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

const SIZES = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export function Avatar({
  person,
  size = "md",
  className,
}: {
  person: AvatarPerson;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-1 ring-white/10",
        gradientFor(person.id),
        SIZES[size],
        className,
      )}
      title={person.name}
      role="img"
      aria-label={person.name}
    >
      <span aria-hidden="true">{person.initials}</span>
    </span>
  );
}

export function AvatarStack({ people, max = 4 }: { people: AvatarPerson[]; max?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-2 rtl:space-x-reverse">
      {shown.map((p) => (
        <Avatar key={p.id} person={p} size="sm" className="ring-2 ring-base-900" />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-slate-300 ring-2 ring-base-900">
          +{extra}
        </span>
      )}
    </div>
  );
}
