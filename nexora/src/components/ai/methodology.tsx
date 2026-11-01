import { RISK_MODEL, RISK_THRESHOLDS } from "@/lib/analytics/risk";
import { Panel } from "@/components/ui/card";

/** Documents the risk model straight from the constants the scorer uses. */
export function Methodology() {
  const rows = [
    {
      factor: "Schedule",
      rule: `${RISK_MODEL.schedule.perPercentagePoint} pt per percentage point of schedule elapsed beyond progress`,
      max: RISK_MODEL.schedule.maxPoints,
    },
    {
      factor: "Budget burn",
      rule: `${RISK_MODEL.budget.perPercentagePoint} pt per percentage point of budget spent beyond progress`,
      max: RISK_MODEL.budget.maxPoints,
    },
    {
      factor: "Overdue tasks",
      rule: `${RISK_MODEL.overdueTasks.perTask} pts per open task past its due date`,
      max: RISK_MODEL.overdueTasks.maxPoints,
    },
    {
      factor: "Blocked tasks",
      rule: `${RISK_MODEL.blockedTasks.perTask} pts per blocked task`,
      max: RISK_MODEL.blockedTasks.maxPoints,
    },
    {
      factor: "Blockers in check-ins",
      rule: `High ${RISK_MODEL.reportedBlockers.perSeverity.high}, medium ${RISK_MODEL.reportedBlockers.perSeverity.medium}, low ${RISK_MODEL.reportedBlockers.perSeverity.low} pts per blocker raised today`,
      max: RISK_MODEL.reportedBlockers.maxPoints,
    },
    {
      factor: "Missed milestones",
      rule: `${RISK_MODEL.missedMilestones.perMilestone} pts per milestone past due and not done`,
      max: RISK_MODEL.missedMilestones.maxPoints,
    },
  ];

  return (
    <Panel
      id="methodology"
      title="How the risk score works"
      description={`Points are summed and capped at 100. Elevated from ${RISK_THRESHOLDS.elevated}, high from ${RISK_THRESHOLDS.high}.`}
      bodyClassName="px-0 sm:px-0 pb-2"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-xs">
          <thead>
            <tr className="border-y border-line text-[11px] uppercase tracking-wider text-ink-subtle">
              <th scope="col" className="px-4 py-2 font-medium sm:px-5">Factor</th>
              <th scope="col" className="px-3 py-2 font-medium">Rule</th>
              <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.factor}>
                <th scope="row" className="px-4 py-2 font-medium text-ink sm:px-5">
                  {row.factor}
                </th>
                <td className="px-3 py-2 text-ink-muted">{row.rule}</td>
                <td className="px-4 py-2 text-right tabular-nums text-ink sm:px-5">{row.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
