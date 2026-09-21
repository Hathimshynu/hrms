"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface Series {
  key: string;
  label: string;
  color: string;
}

interface Props {
  data: Record<string, string | number>[];
  xKey: string;
  series: Series[];
  stacked?: boolean;
  horizontal?: boolean;
  height?: number;
  /** Formats the tick/tooltip label of the category axis (e.g. "2026-09" -> "Sep 2026"). */
  formatX?: (value: string) => string;
  formatValue?: (value: number) => string;
}

// One lightweight bar-chart wrapper for every report chart. Loaded lazily by
// the page (recharts stays out of the initial bundle). Series use distinct
// colours AND appear in the legend and the accompanying data table, so colour
// is never the only carrier of meaning.
export function ReportBarChart({ data, xKey, series, stacked = false, horizontal = false, height = 280, formatX, formatValue }: Props) {
  const fx = (v: unknown) => (formatX ? formatX(String(v)) : String(v));
  const fv = (v: unknown) => (formatValue ? formatValue(Number(v)) : String(v));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 12, left: horizontal ? 8 : -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickFormatter={fv} />
              <YAxis type="category" dataKey={xKey} width={110} tick={{ fontSize: 12 }} tickFormatter={fx} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} tickFormatter={fx} minTickGap={12} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickFormatter={fv} />
            </>
          )}
          <Tooltip labelFormatter={fx} formatter={(v, name) => [fv(v), name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={stacked ? "a" : undefined} isAnimationActive={false} radius={stacked ? 0 : [3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
