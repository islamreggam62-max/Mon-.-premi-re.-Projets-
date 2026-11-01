import { Check, CircleDashed, Minus } from "lucide-react";
import { ROLE_KEYS } from "@/types";
import type { Permission, PermissionLevel, RoleDefinition, RoleKey } from "@/types";
import { cn } from "@/lib/cn";
import { MODULE_LABELS, PERMISSION_LEVEL_LABELS } from "@/lib/labels";
import { ROLE_STYLES } from "@/lib/presentation";
import { Badge } from "@/components/ui/badge";

const LEVEL_STYLE: Record<PermissionLevel, { icon: typeof Check; className: string }> = {
  full: { icon: Check, className: "text-good-ink" },
  limited: { icon: CircleDashed, className: "text-warn-ink" },
  none: { icon: Minus, className: "text-ink-subtle" },
};

export function RoleCards({
  roles,
  counts,
}: {
  readonly roles: readonly RoleDefinition[];
  readonly counts: Readonly<Record<RoleKey, number>>;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {roles.map((role) => {
        const style = ROLE_STYLES[role.key];
        const Icon = style.icon;
        return (
          <li key={role.key} className="min-w-0 rounded-lg border border-line bg-canvas/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                <Icon aria-hidden="true" className="size-4 text-brand-ink" />
                {role.label}
              </span>
              <Badge tone="neutral">{counts[role.key]}</Badge>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-ink-muted">{role.description}</p>
          </li>
        );
      })}
    </ul>
  );
}

/** Read-only role × capability matrix. Every cell states its level in text. */
export function RbacMatrix({
  permissions,
  roles,
}: {
  readonly permissions: readonly Permission[];
  readonly roles: readonly RoleDefinition[];
}) {
  const labels = new Map(roles.map((role) => [role.key, role.label]));
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[52rem] text-left text-xs">
        <caption className="sr-only">Permissions by role</caption>
        <thead>
          <tr className="border-b border-line bg-white/[0.02] text-[11px] uppercase tracking-wider text-ink-subtle">
            <th scope="col" className="sticky left-0 bg-surface px-4 py-2.5 font-medium">
              Capability
            </th>
            {ROLE_KEYS.map((key) => (
              <th key={key} scope="col" className="px-3 py-2.5 font-medium">
                {labels.get(key) ?? key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {permissions.map((permission) => (
            <tr key={permission.id}>
              <th scope="row" className="sticky left-0 max-w-64 bg-surface px-4 py-2.5 font-normal">
                <span className="block text-sm text-ink">{permission.label}</span>
                <span className="block text-[11px] text-ink-subtle">{MODULE_LABELS[permission.module]}</span>
              </th>
              {ROLE_KEYS.map((key) => {
                const grant = permission.grants[key];
                const style = LEVEL_STYLE[grant.level];
                const Icon = style.icon;
                return (
                  <td key={key} className="px-3 py-2.5 align-top">
                    <span className={cn("inline-flex items-center gap-1 font-medium", style.className)}>
                      <Icon aria-hidden="true" className="size-3.5" />
                      {PERMISSION_LEVEL_LABELS[grant.level]}
                    </span>
                    {grant.scope ? <span className="mt-0.5 block text-[11px] text-ink-subtle">{grant.scope}</span> : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
