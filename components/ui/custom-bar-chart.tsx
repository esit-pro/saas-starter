'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';

interface BarChartProps {
  data: Record<string, any>[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  yAxisWidth?: number;
  showAnimation?: boolean;
  className?: string;
}

const colorMap: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#a855f7",
  indigo: "#6366f1",
  emerald: "#10b981",
  rose: "#f43f5e",
  gray: "#6b7280",
  green: "#22c55e",
  orange: "#f97316",
  yellow: "#eab308",
  teal: "#14b8a6",
};

const CustomBarChart: React.FC<BarChartProps> = ({
  data,
  categories,
  index,
  colors = ["blue", "rose"],
  valueFormatter = (value) => `${value}`,
  yAxisWidth = 60,
  showAnimation = false,
  className,
}) => {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 p-3 border border-border rounded-md shadow-md">
          <p className="text-sm font-medium mb-1">{label}</p>
          {payload.map((entry: any, idx: number) => (
            <div key={`tooltip-${idx}`} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}: {valueFormatter(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("w-full h-80", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
          <XAxis 
            dataKey={index} 
            className="text-xs text-muted-foreground" 
            tickLine={false}
          />
          <YAxis 
            width={yAxisWidth} 
            className="text-xs text-muted-foreground" 
            tickFormatter={valueFormatter}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {categories.map((category, idx) => (
            <Bar
              key={category}
              dataKey={category}
              name={category}
              fill={colorMap[colors[idx % colors.length]]}
              radius={[4, 4, 0, 0]}
              isAnimationActive={showAnimation}
              activeBar={{ fillOpacity: 1 }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export { CustomBarChart }; 