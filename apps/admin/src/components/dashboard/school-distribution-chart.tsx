"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SchoolDistributionPoint } from "@/types";

export function SchoolDistributionChart({
  data,
}: {
  data: SchoolDistributionPoint[];
}) {
  const chartData = data.map((item) => ({
    name:
      item.school_name.length > 22
        ? `${item.school_name.slice(0, 20)}…`
        : item.school_name,
    fullName: item.school_name,
    students: item.student_count,
  }));

  return (
    <div className="h-72 w-full" role="img" aria-label="Students by school bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 10 }}>
          <CartesianGrid vertical={false} stroke="#e8eeec" strokeDasharray="4 4" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64807b", fontSize: 11 }}
            interval={0}
            angle={chartData.length > 4 ? -18 : 0}
            textAnchor={chartData.length > 4 ? "end" : "middle"}
            height={chartData.length > 4 ? 54 : 30}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64807b", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "#effcf8" }}
            contentStyle={{
              border: "1px solid #dce5e2",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(18,33,31,.1)",
              fontSize: 12,
            }}
            formatter={(value) => [Number(value).toLocaleString("en-IN"), "Students"]}
            labelFormatter={(_label, payload) =>
              String(payload[0]?.payload?.fullName ?? "")
            }
          />
          <Bar dataKey="students" fill="#17876d" radius={[6, 6, 0, 0]} maxBarSize={46} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
