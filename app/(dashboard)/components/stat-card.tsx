import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardAction } from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Info } from 'lucide-react';

interface TaxBreakdown {
  selfEmploymentTax: number;
  incomeTax: number;
  totalAnnualTax: number;
  deductions: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: number;
  colorClass?: string;
  taxBreakdown?: TaxBreakdown;
}

// Helper function for formatting currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  colorClass = "bg-blue-100 text-blue-600",
  taxBreakdown
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-5 lg:p-6">
        <div className="flex items-start md:items-center gap-3 md:gap-4">
          <div className={`flex-shrink-0 p-2.5 md:p-3 rounded-full ${colorClass} dark:bg-primary/5 dark:text-primary`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
              {taxBreakdown && (
                <Popover>
                  <PopoverTrigger>
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">Tax Breakdown (Annual)</h4>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        <span className="text-muted-foreground">Self-Employment Tax:</span>
                        <span className="text-right">{formatCurrency(taxBreakdown.selfEmploymentTax)}</span>
                        
                        <span className="text-muted-foreground">Income Tax:</span>
                        <span className="text-right">{formatCurrency(taxBreakdown.incomeTax)}</span>
                        
                        <span className="text-muted-foreground">Total Annual Tax:</span>
                        <span className="text-right font-medium">{formatCurrency(taxBreakdown.totalAnnualTax)}</span>
                        
                        <span className="text-muted-foreground">Quarterly Payment:</span>
                        <span className="text-right font-medium">{formatCurrency(taxBreakdown.totalAnnualTax / 4)}</span>
                        
                        <span className="text-muted-foreground pt-2 border-t">Total Deductions:</span>
                        <span className="text-right pt-2 border-t">{formatCurrency(taxBreakdown.deductions)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        This is an estimate based on your current revenue and expenses. 
                        Consult with a tax professional for specific advice.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="flex items-baseline mt-1">
              <p className="text-xl md:text-2xl font-semibold text-foreground">{value}</p>
              {trend !== undefined && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className={`ml-2 text-xs md:text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                        {trend >= 0 ? '+' : ''}{trend}%
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{trend >= 0 ? 'Increase' : 'Decrease'} from previous period</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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