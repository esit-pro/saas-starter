import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardAction } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: number;
  colorClass?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  colorClass = "bg-blue-100 text-blue-600"
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline mt-1">
              <p className="text-2xl font-semibold text-foreground">{value}</p>
              {trend !== undefined && (
                <p className={`ml-2 text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </p>
              )}
            </div>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}