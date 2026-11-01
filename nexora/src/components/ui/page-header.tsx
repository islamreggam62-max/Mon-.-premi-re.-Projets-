import type { ReactNode } from "react";
import { DemoTag } from "./demo-banner";

export function PageHeader({
  title,
  description,
  actions,
  showDemoTag = true,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  showDemoTag?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {showDemoTag ? <DemoTag /> : null}
        </div>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
