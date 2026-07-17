import {
  EvilPieChart,
  Pie,
  Label,
  Legend,
  Tooltip,
} from "@/components/evilcharts/charts/pie-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";

export interface StatusPieSlice {
  name: string;
  value: number;
  fill: string;
}

interface NecStatusPieChartProps {
  data: StatusPieSlice[];
  className?: string;
  innerRadius?: number;
  outerRadius?: number | string;
  paddingAngle?: number;
  cornerRadius?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
}

/**
 * Reusable EvilPieChart untuk distribusi status RSL.
 * Key di-sanitize otomatis sehingga nama dengan spasi (e.g. "Too Strong") aman.
 */
export function NecStatusPieChart({
  data,
  className = "h-full w-full",
  innerRadius = 30,
  outerRadius = "85%",
  paddingAngle = 4,
  cornerRadius = 8,
  showLegend = true,
  showTooltip = true,
}: NecStatusPieChartProps) {
  if (!data || data.length === 0) return null;

  // Sanitize: hapus karakter yang tidak valid untuk CSS variable name
  const sanitized = data.map((d) => ({
    ...d,
    key: d.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, ""),
  }));

  const config: ChartConfig = {};
  sanitized.forEach((d) => {
    config[d.key] = { label: d.name, colors: { light: [d.fill] } };
  });

  const chartData = sanitized.map((d) => ({
    key: d.key,
    name: d.name,
    value: d.value,
  }));

  return (
    <EvilPieChart
      config={config}
      data={chartData}
      dataKey="value"
      nameKey="key"
      className={className}
    >
      <Pie
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        paddingAngle={paddingAngle}
        cornerRadius={cornerRadius}
        isClickable
      >
        <Label />
      </Pie>
      {showTooltip && <Tooltip />}
      {showLegend && <Legend align="center" verticalAlign="bottom" isClickable />}
    </EvilPieChart>
  );
}
