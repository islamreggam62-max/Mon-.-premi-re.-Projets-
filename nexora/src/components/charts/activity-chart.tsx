"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { activitySeries } from "@/lib/demo-data";

export function ActivityChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={activitySeries}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
        <Tooltip
          cursor={{ fill: "rgba(124,58,237,0.08)" }}
          labelStyle={{ color: "#a0abc7" }}
          itemStyle={{ color: "#edf1fa" }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: "#a0abc7" }}
        />
        <Bar
          dataKey="tasks"
          name="Tasks completed"
          fill="#7c3aed"
          radius={[4, 4, 0, 0]}
          maxBarSize={22}
        />
        <Bar
          dataKey="reports"
          name="Reports filed"
          fill="#569cf7"
          radius={[4, 4, 0, 0]}
          maxBarSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
