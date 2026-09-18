// components/ui/BarChartComponent.tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart";

interface BarChartComponentProps {
  data: Array<{
    name: string;
    value: number;
    [key: string]: any;
  }>;
  title?: string;
  description?: string;
  xAxisKey?: string;
  dataKey?: string;
  barColors?: string[];
  showGrid?: boolean;
  showTooltip?: boolean;
  showLabel?: boolean;
  barRadius?: number;
  height?: number | string;
  margin?: { top: number; right: number; bottom: number; left: number };
  animationDuration?: number;
}

// Pre-defined vibrant colors for each bar
const DEFAULT_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

export function BarChartComponent({
  data,
  title,
  description,
  xAxisKey = "name",
  dataKey = "value",
  barColors = DEFAULT_COLORS,
  showGrid = true,
  showTooltip = true,
  showLabel = true,
  barRadius = 5,
  height = 350,
  margin = { top: 30, right: 30, bottom: 50, left: 20 },
  animationDuration = 1500,
}: BarChartComponentProps) {
  // Create chart config for theming
  const chartConfig = {
    [dataKey]: {
      label: "Employees",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <div className="w-full">
      {title && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-stone-800">{title}</h4>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <ChartContainer
        config={chartConfig}
        className="w-full"
        style={{ height }}
      >
        <BarChart
          accessibilityLayer
          data={data}
          margin={margin}
          barGap={8}
          barCategoryGap={20}
        >
          {showGrid && <CartesianGrid vertical={false} strokeDasharray="3 3" />}

          <XAxis
            dataKey={xAxisKey}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fontSize: 12 }}
            interval={0}
          />

          <YAxis
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />

          {showTooltip && (
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          )}

          <Bar
            dataKey={dataKey}
            radius={barRadius}
            maxBarSize={80}
            animationDuration={animationDuration}
            animationEasing="ease-in-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={barColors[index % barColors.length]}
                className="transition-opacity duration-300 hover:opacity-80"
              />
            ))}
            {showLabel && (
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={13}
                fontWeight="700"
                formatter={(value: any) => value}
              />
            )}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
