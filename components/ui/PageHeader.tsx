import { t } from "@/lib/i18n/core";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
          {t(title)}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-slate-300">{t(subtitle)}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
