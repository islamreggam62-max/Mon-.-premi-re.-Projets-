"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { revenueSeries } from "@/lib/demo-data";

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={revenueSeries}
        margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
      >
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="targetFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#569cf7" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#569cf7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickFormatter={(v) => `$${v}k`}
          width={56}
        />
        <Tooltip
          cursor={{ stroke: "#6d28d9", strokeWidth: 1 }}
          formatter={(value: number, name) => [
            `$${value}k`,
            name === "revenue" ? "Revenue" : "Target",
          ]}
          labelStyle={{ color: "#a0abc7" }}
          itemStyle={{ color: "#edf1fa" }}
        />
        <Area
          type="monotone"
          dataKey="target"
          stroke="#569cf7"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="url(#targetFill)"
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#9366f3"
          strokeWidth={2.5}
          fill="url(#revFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
