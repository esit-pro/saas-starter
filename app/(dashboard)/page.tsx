import { getUser, getClientSummary, getTimeTrackingSummary, getExpenseSummary } from '@/lib/db/queries';
import { getServiceTicketsByFilters, getRevenueByMonth } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { StatCard } from './components/stat-card';
import { TimeLogsWidget } from './components/time-logs-widget';
import { 
  Users, 
  Ticket, 
  Clock, 
  CreditCard, 
  Activity,
  MoreHorizontal, 
  ExternalLink,
  Calendar,
  CheckCircle,
  AlertCircle,
  Circle,
  DollarSign,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { RevenueChart } from './components/revenue-chart';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import { teamMembers } from '@/lib/db/schema';

// Helper function for formatting currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculate estimated taxes based on revenue and expense data
 * This is a placeholder implementation that should be replaced with actual tax calculations
 */
const calculateEstimatedTaxes = (
  currentRevenue: number, 
  previousRevenue: number, 
  currentExpenses: number,
  previousExpenses: number
) => {
  // Calculate estimated taxable income (simple implementation)
  const currentTaxableIncome = Math.max(0, currentRevenue - currentExpenses);
  const previousTaxableIncome = Math.max(0, previousRevenue - previousExpenses);

  // Basic progressive tax calculation (placeholder rates)
  // In a real implementation, these would be based on current tax codes
  const calculateTax = (income: number) => {
    if (income <= 0) return 0;
    
    // Simplified progressive tax brackets (for demonstration)
    if (income <= 10000) return income * 0.10;
    if (income <= 40000) return 1000 + (income - 10000) * 0.15;
    if (income <= 90000) return 5500 + (income - 40000) * 0.25;
    return 18000 + (income - 90000) * 0.32;
  };

  // Calculate estimated quarterly tax payment
  const currentEstimatedTax = calculateTax(currentTaxableIncome);
  const previousEstimatedTax = calculateTax(previousTaxableIncome);

  // Calculate the trend percentage
  const taxTrend = previousEstimatedTax > 0
    ? Math.round(((currentEstimatedTax - previousEstimatedTax) / previousEstimatedTax) * 100)
    : 0;

  return {
    estimatedTax: currentEstimatedTax,
    trend: taxTrend
  };
};

const statusColors = {
  'open': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'in-progress': 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'completed': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  'closed': 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'on-hold': 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
}

const priorityIcons = {
  'high': <AlertCircle className="h-4 w-4 text-red-500" />,
  'medium': <Circle className="h-4 w-4 text-amber-500" />,
  'low': <CheckCircle className="h-4 w-4 text-green-500" />,
  'critical': <AlertCircle className="h-4 w-4 text-red-500 fill-red-500" />,
}

export default async function Dashboard() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Get the team ID for the current user
  const teamMemberResult = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);
  
  const teamId = teamMemberResult[0]?.teamId;
  
  if (!teamId) {
    // Handle case where user doesn't have a team
    redirect('/create-team');
  }

  // Get real data from the database
  const clientsData = await getClientSummary(teamId);
  
  // Current period (last 30 days)
  const currentEndDate = new Date();
  const currentStartDate = new Date();
  currentStartDate.setDate(currentStartDate.getDate() - 30);
  
  // Previous period (30-60 days ago)
  const previousEndDate = new Date(currentStartDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1); // Day before current period starts
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - 30); // 30 days before previous end date

  // Get active tickets count for current period
  const currentActiveTickets = await getServiceTicketsByFilters(teamId, { 
    status: 'open' 
  });
  
  // Get active tickets count for previous period
  const previousActiveTickets = await getServiceTicketsByFilters(teamId, { 
    status: 'open',
    createdBefore: currentStartDate
  });
  
  // Calculate tickets trend percentage
  const ticketsTrend = previousActiveTickets.length > 0 
    ? Math.round(((currentActiveTickets.length - previousActiveTickets.length) / previousActiveTickets.length) * 100) 
    : 0;
  
  // Get time tracking data for the current period
  const currentTimeData = await getTimeTrackingSummary(teamId, {
    startDate: currentStartDate,
    endDate: currentEndDate
  });
  
  // Get time tracking data for the previous period
  const previousTimeData = await getTimeTrackingSummary(teamId, {
    startDate: previousStartDate,
    endDate: previousEndDate
  });
  
  // Calculate hours tracked trend percentage
  const hoursTrend = (previousTimeData?.totalHours || 0) > 0
    ? Math.round((((currentTimeData?.totalHours || 0) - (previousTimeData?.totalHours || 0)) / (previousTimeData?.totalHours || 1)) * 100)
    : 0;
  
  // Get expense data for the current period
  const currentExpenseData = await getExpenseSummary(teamId, {
    startDate: currentStartDate,
    endDate: currentEndDate
  });
  
  // Get expense data for the previous period
  const previousExpenseData = await getExpenseSummary(teamId, {
    startDate: previousStartDate,
    endDate: previousEndDate
  });
  
  // Calculate expenses trend percentage
  const expensesTrend = (previousExpenseData?.totalExpenses || 0) > 0
    ? Math.round((((currentExpenseData?.totalExpenses || 0) - (previousExpenseData?.totalExpenses || 0)) / (previousExpenseData?.totalExpenses || 1)) * 100)
    : 0;
  
  // Get recent tickets (all statuses, limit to 4)
  const recentTickets = await getServiceTicketsByFilters(teamId, {}, 4);
  
  // Calculate revenue data based on billed time and expenses
  const currentRevenue = (currentTimeData?.totalBillableAmount || 0) + (currentExpenseData?.totalBillableAmount || 0);
  const previousRevenue = (previousTimeData?.totalBillableAmount || 0) + (previousExpenseData?.totalBillableAmount || 0);
  
  // Calculate revenue trend percentage
  const revenueTrend = previousRevenue > 0
    ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
    : 0;

  // Calculate estimated taxes
  const taxData = calculateEstimatedTaxes(
    currentRevenue,
    previousRevenue,
    currentExpenseData?.totalExpenses || 0,
    previousExpenseData?.totalExpenses || 0
  );

  // Get actual revenue data for the current year
  const currentYear = new Date().getFullYear();
  const revenueChartData = await getRevenueByMonth(teamId, currentYear);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Last 30 days
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          title="Net Revenue" 
          value={formatCurrency(currentRevenue)} 
          description="Month to date" 
          icon={DollarSign}
          trend={revenueTrend}
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard 
          title="Estimated Taxes Due" 
          value={formatCurrency(taxData.estimatedTax)} 
          description="Based on current period" 
          icon={Receipt}
          trend={taxData.trend}
          colorClass="bg-purple-100 text-purple-600"
        />
        <StatCard 
          title="Hours Tracked" 
          value={`${currentTimeData?.totalHours || 0}h`} 
          description={`${currentTimeData?.billableHours || 0}h billable`} 
          icon={Clock}
          trend={hoursTrend}
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(currentExpenseData?.totalExpenses || 0)} 
          description={`${formatCurrency(currentExpenseData?.billableExpenses || 0)} billable`} 
          icon={CreditCard}
          trend={expensesTrend}
          colorClass="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Bottom widgets - stack on md screens as well */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-none pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Recent Tickets</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tickets" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  View all
                  <ExternalLink className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <div className="px-6">
              <ul className="divide-y divide-border">
                {/* Recent tickets */}
                {recentTickets.map((ticketData) => (
                  <li key={ticketData.ticket.id} className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {priorityIcons[ticketData.ticket.priority as keyof typeof priorityIcons]}
                          <Link 
                            href={`/dashboard/tickets?id=${ticketData.ticket.id}`}
                            className="text-sm font-medium text-foreground hover:text-primary"
                          >
                            {ticketData.ticket.title}
                          </Link>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {ticketData.client?.name || 'Unknown Client'}
                          </span>
                          <span className="text-muted">•</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(ticketData.ticket.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[ticketData.ticket.status as keyof typeof statusColors]}`}>
                          {ticketData.ticket.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Time Logs Widget */}
        <TimeLogsWidget teamId={teamId} />

        {/* Revenue Overview - Move to the next row, full width on desktop */}
        <Card className="flex flex-col min-h-[350px] lg:min-h-[400px] xl:col-span-2">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Revenue Overview</CardTitle>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="h-full">
              <div className="grid grid-cols-1 gap-4 h-full">
                <div className="bg-transparent p-4 rounded-lg h-full flex flex-col">
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground">Monthly Revenue</h3>
                    <span className="text-sm text-muted-foreground">This Year</span>
                  </div>
                  <div className="flex-grow">
                    <RevenueChart data={revenueChartData} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
