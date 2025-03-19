import { getUser, getClientSummary, getServiceTickets, getTimeTrackingSummary, getExpenseSummary } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { StatCard } from './components/stat-card';
import { SplitView } from './components/split-view';
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
  Circle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

// Helper function to get random data for demo
const getRandomData = (count: number, max: number) => {
  return Array.from({ length: count }, () => Math.floor(Math.random() * max));
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const recentTickets = [
  {
    id: 1,
    title: 'Website downtime issue',
    client: 'Acme Corp',
    status: 'open',
    priority: 'high',
    created: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: 2,
    title: 'Email configuration',
    client: 'Globex Inc',
    status: 'in-progress',
    priority: 'medium',
    created: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: 3,
    title: 'Backup failure',
    client: 'Wayne Enterprises',
    status: 'open',
    priority: 'high',
    created: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: 4,
    title: 'New user setup',
    client: 'Stark Industries',
    status: 'completed',
    priority: 'low',
    created: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const statusColors = {
  'open': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'in-progress': 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'completed': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  'closed': 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const priorityIcons = {
  'high': <AlertCircle className="h-4 w-4 text-red-500" />,
  'medium': <Circle className="h-4 w-4 text-amber-500" />,
  'low': <CheckCircle className="h-4 w-4 text-green-500" />,
}

export default async function Dashboard() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // In a real app, you would fetch this data from your database
  // For this demo, we'll use the functions we created but with mock data
  const clientsData = { clientCount: 12, activeTicketsCount: 7 };
  const timeData = { 
    totalHours: 120, 
    billableHours: 92, 
    billedHours: 73 
  };
  const expenseData = { 
    totalExpenses: 4250, 
    billableExpenses: 3750, 
    billedExpenses: 2800 
  };

  // Chart data
  const monthlyData = getRandomData(12, 15000);
  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
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
          title="Total Clients" 
          value={clientsData.clientCount} 
          description="Active clients" 
          icon={Users}
          colorClass="bg-purple-100 text-purple-600"
        />
        <StatCard 
          title="Open Tickets" 
          value={clientsData.activeTicketsCount} 
          description="Awaiting resolution" 
          icon={Ticket}
          trend={12}
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="Hours Tracked" 
          value={`${timeData.totalHours}h`} 
          description={`${timeData.billableHours}h billable`} 
          icon={Clock}
          trend={8}
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(expenseData.totalExpenses)} 
          description={`${formatCurrency(expenseData.billableExpenses)} billable`} 
          icon={CreditCard}
          trend={-3}
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
                {/* Show fewer items on small screens */}
                {(recentTickets.slice(0, recentTickets.length)).map((ticket) => (
                  <li key={ticket.id} className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {priorityIcons[ticket.priority as keyof typeof priorityIcons]}
                          <Link 
                            href={`/dashboard/tickets/${ticket.id}`}
                            className="text-sm font-medium text-foreground hover:text-primary"
                          >
                            {ticket.title}
                          </Link>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{ticket.client}</span>
                          <span className="text-muted">•</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(ticket.created, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Overview */}
        <Card className="flex flex-col min-h-[350px] lg:min-h-[400px]">
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
                <div className="bg-primary/5 p-4 rounded-lg h-full flex flex-col">
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground">Monthly Revenue</h3>
                    <span className="text-sm text-muted-foreground">This Year</span>
                  </div>
                  <div className="relative flex-grow mb-4 min-h-[180px] lg:min-h-[250px]">
                    {/* Bar chart rendered here - using a mock for now */}
                    <div className="flex items-end justify-between h-full px-2">
                      {monthlyData.map((value, index) => (
                        <div 
                          key={index} 
                          className="w-6 lg:w-4 bg-primary rounded-t relative group"
                          style={{ height: `${(value / 15000) * 100}%` }}
                        >
                          <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground border border-border text-xs rounded py-1 px-2 whitespace-nowrap shadow-md">
                            {formatCurrency(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      {monthlyLabels.map((label, index) => (
                        <div key={index} className="text-center truncate w-8 lg:w-6">{label}</div>
                      ))}
                    </div>
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
