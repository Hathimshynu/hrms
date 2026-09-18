"use client";

import { format } from "date-fns";
import * as React from "react";

import { BarChartComponent } from "@/src/components/ui/BarChartComponent";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

interface AttendanceRecordLike {
  status: string;
}

interface AttendanceBarChartProps {
  /** Attendance rows already filtered down to the selected date */
  data: AttendanceRecordLike[];
  /** The date this chart is showing counts for */
  selectedDate: Date | null;
}

/** Fixed status order so bars appear in a consistent sequence every render */
const STATUS_SEQUENCE = [
  "Present",
  "Late",
  "Work From Home",
  "Half Day",
  "On Leave",
  "Absent",
] as const;

const STATUS_COLORS: Record<string, string> = {
  Present: "#10b981", // emerald
  Late: "#f59e0b", // amber
  "Work From Home": "#06b6d4", // cyan
  "Half Day": "#8b5cf6", // purple
  "On Leave": "#3b82f6", // blue
  Absent: "#ef4444", // red
};

export function AttendanceBarChart({
  data,
  selectedDate,
}: AttendanceBarChartProps) {
  const chartData = React.useMemo(() => {
    const counts = new Map<string, number>();

    data.forEach((row) => {
      counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    });

    return STATUS_SEQUENCE.map((status) => ({
      name: status,
      fullName: status,
      value: counts.get(status) ?? 0,
      status,
    }));
  }, [data]);

  const barColors = STATUS_SEQUENCE.map((status) => STATUS_COLORS[status]);

  const totalRecords = data.length;

  return (
    <Card className="flex h-[480px] w-full flex-col">
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className="text-lg font-semibold text-ink">
          Attendance Breakdown
        </CardTitle>
        <p className="text-sm text-muted">
          {selectedDate
            ? `${totalRecords} record${totalRecords === 1 ? "" : "s"} on ${format(selectedDate, "PPP")}`
            : `${totalRecords} record${totalRecords === 1 ? "" : "s"}`}
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <BarChartComponent
          data={chartData}
          height={320}
          barColors={barColors}
          margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
          animationDuration={800}
        />
      </CardContent>
    </Card>
  );
}
