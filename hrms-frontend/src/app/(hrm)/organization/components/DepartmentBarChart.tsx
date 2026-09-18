// components/DepartmentBarChart.tsx
"use client";

import { BarChartComponent } from "@/src/components/ui/BarChartComponent";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

interface DepartmentBarChartProps {
  departments: Array<{
    name: string;
    code: string;
    employeeCount: number;
    status: string;
  }>;
}

// Custom colors for your 6 departments
const DEPARTMENT_COLORS = [
  "#3b82f6", // IT - Blue
  "#8b5cf6", // HR - Purple
  "#FF5F1F", // FMCG - Amber
  "#10b981", // BDE - Emerald
  "#06b6d4", // BPO - Cyan
  "#ec4899", // Medical - Pink
];

export function DepartmentBarChart({ departments }: DepartmentBarChartProps) {
  // Prepare chart data sorted by employee count
  const chartData = departments
    .map((dept) => ({
      name: dept.code || dept.name.substring(0, 3),
      fullName: dept.name,
      value: dept.employeeCount,
      status: dept.status,
    }))
    .sort((a, b) => b.value - a.value);

  const totalEmployees = departments.reduce(
    (sum, dept) => sum + dept.employeeCount,
    0,
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-stone-800">
          Employee Distribution by Department
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total Employees: {totalEmployees} across {departments.length}{" "}
          departments
        </p>
      </CardHeader>
      <CardContent>
        <BarChartComponent
          data={chartData}
          height={380}
          barColors={DEPARTMENT_COLORS}
          margin={{ top: 40, right: 30, bottom: 40, left: 20 }}
          animationDuration={1500}
        />
      </CardContent>
    </Card>
  );
}
