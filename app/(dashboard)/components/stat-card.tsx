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
      <CardContent className="p-4 md:p-5 lg:p-6">
        <div className="flex items-start md:items-center gap-3 md:gap-4">
          <div className={`flex-shrink-0 p-2.5 md:p-3 rounded-full ${colorClass} dark:bg-primary/5 dark:text-primary`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <div className="flex items-baseline mt-1">
              <p className="text-xl md:text-2xl font-semibold text-foreground">{value}</p>
              {trend !== undefined && (
                <p className={`ml-2 text-xs md:text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </p>
              )}
            </div>
            {description && (
              <p className="mt-1 text-xs md:text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}