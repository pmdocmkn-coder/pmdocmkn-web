"use client";

import {
  EvilBarChart,
  Bar,
  XAxis,
  YAxis,
  Grid,
  Tooltip,
  Legend,
} from "@/components/evilcharts/charts/bar-chart";

interface TrendMonth {
  monthName: string;
  completed: number;
  overdue: number;
  [key: string]: unknown;
}

interface PmTrendChartProps {
  data: TrendMonth[];
}

export default function PmTrendChart({ data }: PmTrendChartProps) {
  return (
    <EvilBarChart
      config={{
        completed: { label: "Selesai", colors: { light: ["#059669"] } },
        overdue:   { label: "Overdue", colors: { light: ["#DC2626"] } },
      }}
      data={data}
      stackType="stacked"
      barRadius={4}
      animationType="left-to-right"
      className="h-full w-full"
    >
      <Grid stroke="#E2E8F0" />
      <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: "#718096" }} />
      <YAxis tick={{ fontSize: 11, fill: "#718096" }} width={30} />
      <Tooltip />
      <Legend align="right" verticalAlign="top" />
      <Bar dataKey="completed" />
      <Bar dataKey="overdue" />
    </EvilBarChart>
  );
}
