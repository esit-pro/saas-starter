'use client';

import { CustomBarChart } from '@/components/ui/custom-bar-chart';

// Format currency for display
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface RevenueData {
  month: string;
  Revenue: number;
  Expenses: number;
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <CustomBarChart
      className="h-[280px]"
      data={data}
      index="month"
      categories={["Revenue", "Expenses"]}
      colors={["blue", "rose"]}
      yAxisWidth={65}
      showAnimation={true}
      valueFormatter={(value: number) => formatCurrency(value)}
    />
  );
}