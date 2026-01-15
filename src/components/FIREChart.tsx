"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/simulation";

interface FIREChartProps {
  percentiles: Map<number, number[]>;
  years: number;
}

export function FIREChart({ percentiles, years }: FIREChartProps) {
  // Transform data for recharts
  const chartData = [];

  for (let i = 0; i < years; i++) {
    chartData.push({
      year: i + 1,
      p10: percentiles.get(10)?.[i] || 0,
      p25: percentiles.get(25)?.[i] || 0,
      p50: percentiles.get(50)?.[i] || 0,
      p75: percentiles.get(75)?.[i] || 0,
      p90: percentiles.get(90)?.[i] || 0,
    });
  }

  const formatYAxis = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">Year {label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600 dark:text-green-400">
              90p: {formatCurrency(payload.find((p: any) => p.dataKey === "p90")?.value || 0)}
            </p>
            <p className="text-emerald-600 dark:text-emerald-400">
              75p: {formatCurrency(payload.find((p: any) => p.dataKey === "p75")?.value || 0)}
            </p>
            <p className="text-blue-600 dark:text-blue-400 font-semibold">
              50p: {formatCurrency(payload.find((p: any) => p.dataKey === "p50")?.value || 0)}
            </p>
            <p className="text-amber-600 dark:text-amber-400">
              25p: {formatCurrency(payload.find((p: any) => p.dataKey === "p25")?.value || 0)}
            </p>
            <p className="text-orange-600 dark:text-orange-400">
              10p: {formatCurrency(payload.find((p: any) => p.dataKey === "p10")?.value || 0)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorP90" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorP75" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            label={{
              value: "Years",
              position: "insideBottom",
              offset: -5,
              fontSize: 12,
            }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                p90: "90p",
                p75: "75p",
                p50: "50p",
                p25: "25p",
                p10: "10p",
              };
              return labels[value] || value;
            }}
          />

          {/* 10th-90th percentile range (outer band) */}
          <Area
            type="monotone"
            dataKey="p90"
            stackId="1"
            stroke="#22c55e"
            strokeWidth={1.5}
            fill="url(#colorP90)"
            name="p90"
          />
          <Area
            type="monotone"
            dataKey="p75"
            stackId="2"
            stroke="#10b981"
            strokeWidth={1.5}
            fill="url(#colorP75)"
            name="p75"
          />
          <Area
            type="monotone"
            dataKey="p50"
            stackId="3"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorP50)"
            name="p50"
          />
          <Area
            type="monotone"
            dataKey="p25"
            stackId="4"
            stroke="#f59e0b"
            strokeWidth={1.5}
            fill="transparent"
            name="p25"
          />
          <Area
            type="monotone"
            dataKey="p10"
            stackId="5"
            stroke="#f97316"
            strokeWidth={1.5}
            fill="transparent"
            name="p10"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
