import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  className,
  sheen = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { sheen?: boolean }) {
  return (
    <div
      className={cn("nx-card", sheen && "nx-sheen", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-subtle">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
