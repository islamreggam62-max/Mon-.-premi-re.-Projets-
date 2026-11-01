import type { ISODate } from "@/types";
import type { MilestoneRow } from "@/lib/queries";
import { describeDue, formatDate } from "@/lib/format";
import { MILESTONE_STYLES } from "@/lib/presentation";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";

export function MilestoneTracker({
  milestones,
  today,
}: {
  readonly milestones: readonly MilestoneRow[];
  readonly today: ISODate;
}) {
  return (
    <Panel
      id="milestone-tracker"
      title="Milestone tracker"
      description="Every open checkpoint across initiatives in flight, missed ones first."
      bodyClassName="px-0 sm:px-0 pb-2"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-y border-line text-[11px] uppercase tracking-wider text-ink-subtle">
              <th scope="col" className="px-4 py-2 font-medium sm:px-5">Due</th>
              <th scope="col" className="px-3 py-2 font-medium">Milestone</th>
              <th scope="col" className="px-3 py-2 font-medium">Initiative</th>
              <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {milestones.map((milestone) => (
              <tr key={milestone.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-4 py-2.5 sm:px-5">
                  <time dateTime={milestone.dueDate} className="font-medium tabular-nums text-ink">
                    {formatDate(milestone.dueDate)}
                  </time>
                  <p className="text-[11px] text-ink-subtle">{describeDue(milestone.dueDate, today)}</p>
                </td>
                <th scope="row" className="px-3 py-2.5 font-normal text-ink">
                  {milestone.title}
                </th>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-2">
                    <Badge tone="brand">{milestone.project.code}</Badge>
                    <span className="text-ink-muted">{milestone.project.name}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right sm:px-5">
                  <StatusBadge style={MILESTONE_STYLES[milestone.state]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
