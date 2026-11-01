import { CircleCheck } from "lucide-react";
import type { BlockerSeverity } from "@/types";
import type { ReportRow } from "@/lib/queries";
import { pluralize } from "@/lib/format";
import { BLOCKER_STYLES } from "@/lib/presentation";
import { StatusBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/notice";

const SEVERITY_RANK: Record<BlockerSeverity, number> = { high: 0, medium: 1, low: 2 };

/** Every blocker raised today, most severe first, with who can clear it. */
export function BlockersPanel({
  reports,
  className,
}: {
  readonly reports: readonly ReportRow[];
  readonly className?: string;
}) {
  const blockers = reports
    .flatMap((report) => report.blockers.map((blocker) => ({ ...blocker, author: report.author })))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const high = blockers.filter((blocker) => blocker.severity === "high").length;

  return (
    <Panel
      id="blockers"
      title="Blockers raised today"
      description={`${pluralize(blockers.length, "blocker")}, ${high} high severity. Escalate the ones that need someone outside the team.`}
      className={className}
      bodyClassName="px-0 sm:px-0 pb-2"
    >
      {blockers.length === 0 ? (
        <div className="px-4 sm:px-5">
          <EmptyState icon={CircleCheck} title="No blockers today" />
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {blockers.map((blocker) => (
            <li key={`${blocker.author.id}-${blocker.text}`} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
              <StatusBadge style={BLOCKER_STYLES[blocker.severity]} prefix="Severity" className="self-start" />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-5 text-ink">
                  {blocker.text}
                  {blocker.taskKey ? (
                    <span className="ml-1.5 rounded bg-white/[0.06] px-1 font-mono text-[10px] text-ink-subtle">
                      {blocker.taskKey}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-ink-subtle">
                  Raised by {blocker.author.name}
                  {blocker.needsHelpFrom ? (
                    <>
                      {" · "}
                      <span className="text-ink-muted">needs {blocker.needsHelpFrom.name}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
