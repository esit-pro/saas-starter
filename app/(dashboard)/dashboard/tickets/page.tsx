'use client';

import { useEffect, useState } from 'react';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye,
  Ticket,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Plus,
  X,
  MessageSquare,
  DollarSign as DollarSignIcon,
  Paperclip as PaperclipIcon,
  Calendar as CalendarIcon
} from 'lucide-react';
import { SplitView } from '../../components/split-view';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '../../components/data-table';
import { TicketWidgetsCard } from '../../components/ticket-widgets-card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { CreateTicketForm } from '../../components/create-ticket-form';
import { TicketComments } from '../../components/ticket-comments';
import { TimeEntryForm } from '../../components/time-entry-form';
import { ExpenseForm } from '../../components/expense-form';

// Service Ticket type definition
type ServiceTicket = {
  id: number;
  title: string;
  client: string;
  clientId: number;
  assignedTo: string;
  status: 'open' | 'in-progress' | 'on-hold' | 'completed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  createdAt: Date;
  dueDate: Date | null;
};

// Client type
type Client = {
  id: number;
  name: string;
};

// Comment type
type Comment = {
  id: number;
  content: string;
  createdAt: Date;
  isInternal: boolean;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
};

// Demo data
const demoTickets: ServiceTicket[] = [
  {
    id: 1,
    title: 'Website downtime issue',
    client: 'Acme Corporation',
    clientId: 1,
    assignedTo: 'Jane Smith',
    status: 'open',
    priority: 'high',
    category: 'Website',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    title: 'Email configuration issue',
    client: 'Globex Inc',
    clientId: 2,
    assignedTo: 'John Doe',
    status: 'in-progress',
    priority: 'medium',
    category: 'Email',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    title: 'Server backup failure',
    client: 'Wayne Enterprises',
    clientId: 3,
    assignedTo: 'Jane Smith',
    status: 'open',
    priority: 'critical',
    category: 'Server',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 4,
    title: 'New user setup request',
    client: 'Stark Industries',
    clientId: 4,
    assignedTo: 'John Doe',
    status: 'completed',
    priority: 'low',
    category: 'User Management',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    dueDate: null,
  },
  {
    id: 5,
    title: 'VPN connection issues',
    client: 'Oscorp',
    clientId: 5,
    assignedTo: 'Jane Smith',
    status: 'on-hold',
    priority: 'medium',
    category: 'Networking',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 6,
    title: 'Data recovery request',
    client: 'Umbrella Corporation',
    clientId: 6,
    assignedTo: 'John Doe',
    status: 'in-progress',
    priority: 'high',
    category: 'Data Services',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 7,
    title: 'Software license renewal',
    client: 'Cyberdyne Systems',
    clientId: 7,
    assignedTo: 'Jane Smith',
    status: 'open',
    priority: 'medium',
    category: 'Licensing',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: 8,
    title: 'Hardware replacement request',
    client: 'LexCorp',
    clientId: 8,
    assignedTo: 'John Doe',
    status: 'completed',
    priority: 'low',
    category: 'Hardware',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    dueDate: null,
  },
  {
    id: 9,
    title: 'Cloud storage expansion',
    client: 'Weyland-Yutani Corp',
    clientId: 9,
    assignedTo: 'Jane Smith',
    status: 'closed',
    priority: 'medium',
    category: 'Cloud Services',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    dueDate: null,
  },
  {
    id: 10,
    title: 'Network security audit',
    client: 'Tyrell Corporation',
    clientId: 10,
    assignedTo: 'John Doe',
    status: 'in-progress',
    priority: 'high',
    category: 'Security',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
];

const demoClients: Client[] = [
  { id: 1, name: 'Acme Corporation' },
  { id: 2, name: 'Globex Inc' },
  { id: 3, name: 'Wayne Enterprises' },
  { id: 4, name: 'Stark Industries' },
  { id: 5, name: 'Oscorp' },
  { id: 6, name: 'Umbrella Corporation' },
  { id: 7, name: 'Cyberdyne Systems' },
  { id: 8, name: 'LexCorp' },
  { id: 9, name: 'Weyland-Yutani Corp' },
  { id: 10, name: 'Tyrell Corporation' },
];

// Demo comments for the first ticket
const demoComments: Comment[] = [
  {
    id: 1,
    content: 'Called the client and they reported that the website is down since this morning.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    isInternal: false,
    user: {
      id: 1,
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  },
  {
    id: 2,
    content: 'Checked server logs, found spike in traffic before outage.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isInternal: true,
    user: {
      id: 2,
      name: 'John Doe',
      email: 'john@example.com',
    },
  },
];

const statusColors: Record<string, string> = {
  'open': 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  'in-progress': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  'on-hold': 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  'completed': 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  'closed': 'bg-gray-50 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400',
};

const priorityIcons: Record<string, React.ReactNode> = {
  'low': <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />,
  'medium': <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />,
  'high': <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />,
  'critical': <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-500" />,
};

// Type definitions for time entries and expenses
type TimeEntry = {
  id: number;
  ticketId: number;
  clientId: number;
  description: string;
  startTime: Date;
  duration: number; // in minutes
  billable: boolean;
  user: {
    id: number;
    name: string;
  };
};

type Expense = {
  id: number;
  ticketId: number;
  description: string;
  amount: number;
  date: Date;
  category: string;
  billable: boolean;
  receiptUrl?: string;
};

// Demo time entries
const demoTimeEntries: TimeEntry[] = [
  {
    id: 1,
    ticketId: 1,
    clientId: 1,
    description: "Server diagnostics and initial troubleshooting",
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    duration: 45, // 45 minutes
    billable: true,
    user: {
      id: 1,
      name: "Jane Smith"
    }
  },
  {
    id: 2,
    ticketId: 1,
    clientId: 1,
    description: "Configuration review and server restart attempts",
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    duration: 30, // 30 minutes
    billable: true,
    user: {
      id: 2,
      name: "John Doe"
    }
  }
];

// Demo expenses
const demoExpenses: Expense[] = [
  {
    id: 1,
    ticketId: 1,
    description: "Emergency server parts",
    amount: 156.99,
    date: new Date(Date.now() - 3 * 60 * 60 * 1000),
    category: "Hardware",
    billable: true
  }
];

// Status history to track ticket progress
type StatusChange = {
  id: number;
  ticketId: number;
  status: string;
  timestamp: Date;
  user: {
    id: number;
    name: string;
  };
};

const demoStatusHistory: StatusChange[] = [
  {
    id: 1,
    ticketId: 1,
    status: "open",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    user: {
      id: 1,
      name: "Jane Smith"
    }
  },
  {
    id: 2,
    ticketId: 1,
    status: "in-progress",
    timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
    user: {
      id: 2,
      name: "John Doe"
    }
  },
  {
    id: 3,
    ticketId: 1,
    status: "on-hold",
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
    user: {
      id: 2,
      name: "John Doe"
    }
  },
  {
    id: 4,
    ticketId: 1,
    status: "in-progress",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    user: {
      id: 1,
      name: "Jane Smith"
    }
  }
];

// Ticket detail pane component
function TicketDetailPane({ 
  ticket, 
  comments, 
  timeEntries, 
  expenses, 
  statusHistory,
  onAddComment,
  onLogTime,
  onAddExpense
}: { 
  ticket: ServiceTicket | null;
  comments: Comment[];
  timeEntries: TimeEntry[];
  expenses: Expense[];
  statusHistory: StatusChange[];
  onAddComment: (comment: { content: string; isInternal: boolean }) => void;
  onLogTime: (timeEntry: any) => void;
  onAddExpense?: (expense: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<'activity' | 'time' | 'expenses'>('activity');

  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Ticket className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Select a ticket to view details</h3>
          <p className="mt-2">Click on a ticket from the list to view the detailed information</p>
        </div>
      </div>
    );
  }

  // Calculate total time spent
  const totalMinutes = timeEntries.reduce((acc, entry) => acc + entry.duration, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeSpentString = hours > 0 
    ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
    : `${minutes}m`;

  // Calculate total expenses
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 flex flex-col gap-6">
        {/* Ticket header */}
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-primary/5 flex items-center justify-center text-gray-500 dark:text-primary mr-4">
            <Ticket className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">{ticket.title}</h2>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium capitalize ${statusColors[ticket.status]}`}>
                {ticket.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-muted-foreground flex items-center flex-wrap gap-4 mt-1">
              <div className="flex items-center">
                <span>Ticket #{ticket.id}</span>
              </div>
              <div className="flex items-center">
                <span>Client: {ticket.client}</span>
              </div>
              <div className="flex items-center">
                <span>Created {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket details cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border dark:border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">Priority</h3>
            <div className="flex items-center">
              {priorityIcons[ticket.priority]}
              <span className="ml-2 font-medium capitalize text-gray-900 dark:text-foreground">{ticket.priority}</span>
            </div>
          </div>
          
          <div className="border dark:border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">Time Tracked</h3>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="font-medium text-gray-900 dark:text-foreground">
                {timeEntries.length > 0 ? timeSpentString : "No time entries"}
              </span>
            </div>
          </div>
          
          <div className="border dark:border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">Expenses</h3>
            <div className="flex items-center">
              <DollarSignIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="font-medium text-gray-900 dark:text-foreground">
                {expenses.length > 0 ? `$${totalExpenses.toFixed(2)}` : "No expenses"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="border-b dark:border-border">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-2 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-primary text-primary dark:text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Activity & Comments
            </button>
            <button
              onClick={() => setActiveTab('time')}
              className={`py-2 border-b-2 font-medium text-sm ${
                activeTab === 'time'
                  ? 'border-primary text-primary dark:text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Time Entries
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-2 border-b-2 font-medium text-sm ${
                activeTab === 'expenses'
                  ? 'border-primary text-primary dark:text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Expenses
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="min-h-[400px]">
          {activeTab === 'activity' && (
            <div className="space-y-8">
              {/* Status history timeline */}
              <div className="border dark:border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">Status History</h3>
                
                <div className="space-y-4">
                  {statusHistory.map((change) => (
                    <div key={change.id} className="relative pl-6 pb-4 last:pb-0 border-l dark:border-border">
                      <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500"></div>
                      <div className="text-sm text-gray-500 dark:text-muted-foreground">
                        {formatDistanceToNow(change.timestamp, { addSuffix: true })}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-foreground mt-1">
                        Status changed to <span className="capitalize">{change.status}</span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                        Changed by {change.user.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Comments section */}
              <div className="border dark:border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">Comments</h3>
                <TicketComments
                  ticketId={ticket.id}
                  comments={comments}
                  onAddComment={onAddComment}
                />
              </div>
            </div>
          )}

          {activeTab === 'time' && (
            <div className="space-y-6">
              {/* Time log form */}
              <div className="border dark:border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">Log Time</h3>
                <TimeEntryForm
                  ticketId={ticket.id}
                  clientId={ticket.clientId}
                  onLogTime={onLogTime}
                />
              </div>
              
              {/* Time entries list */}
              <div className="border dark:border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">
                  Time Entries {timeEntries.length > 0 && `(${timeSpentString} total)`}
                </h3>
                
                {timeEntries.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No time entries logged yet</p>
                ) : (
                  <div className="space-y-4">
                    {timeEntries.map((entry) => {
                      const entryHours = Math.floor(entry.duration / 60);
                      const entryMinutes = entry.duration % 60;
                      const durationStr = entryHours > 0 
                        ? `${entryHours}h ${entryMinutes > 0 ? `${entryMinutes}m` : ''}`
                        : `${entryMinutes}m`;
                        
                      return (
                        <div key={entry.id} className="flex items-start border-b dark:border-border pb-4 last:border-0 last:pb-0">
                          <div className="w-12 h-12 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                            <Clock className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900 dark:text-foreground">
                                {entry.description}
                              </div>
                              <span className="text-sm text-gray-500 dark:text-muted-foreground">
                                {durationStr}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-sm text-gray-500 dark:text-muted-foreground">
                                {entry.user.name} • {formatDistanceToNow(entry.startTime, { addSuffix: true })}
                              </div>
                              <div>
                                {entry.billable ? (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                                    Billable
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-300 rounded-full">
                                    Non-billable
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              {/* Expense form */}
              <div className="border dark:border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">Add Expense</h3>
                <ExpenseForm 
                  ticketId={ticket.id}
                  onAddExpense={onAddExpense}
                />
              </div>
              
              {/* Expenses list */}
              <div className="border dark:border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">
                  Expenses {expenses.length > 0 && `($${totalExpenses.toFixed(2)} total)`}
                </h3>
                
                {expenses.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No expenses recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-start border-b dark:border-border pb-4 last:border-0 last:pb-0">
                        <div className="w-12 h-12 rounded-md bg-green-50 dark:bg-green-950 flex items-center justify-center text-green-600 dark:text-green-400 mr-4">
                          <DollarSignIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 dark:text-foreground">
                              {expense.description}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-foreground">
                              ${expense.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-sm text-gray-500 dark:text-muted-foreground">
                              {expense.category} • {formatDistanceToNow(expense.date, { addSuffix: true })}
                            </div>
                            <div>
                              {expense.billable ? (
                                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                                  Billable
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-300 rounded-full">
                                  Non-billable
                                </span>
                              )}
                            </div>
                          </div>
                          {expense.receiptUrl && (
                            <div className="mt-2">
                              <a 
                                href={expense.receiptUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                              >
                                <PaperclipIcon className="h-3 w-3 mr-1" />
                                View Receipt
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [activeTickets, setActiveTickets] = useState<ServiceTicket[]>([]);
  const [completedTickets, setCompletedTickets] = useState<ServiceTicket[]>([]);
  const [selectedTab, setSelectedTab] = useState('active');
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [comments, setComments] = useState<Comment[]>(demoComments);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(demoTimeEntries);
  const [expenses, setExpenses] = useState<Expense[]>(demoExpenses);
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>(demoStatusHistory);
  const [clients, setClients] = useState<Client[]>(demoClients);
  useEffect(() => {
    // In a real app, you'd fetch data from an API
    // For this demo, we'll use the demo data
    setTickets(demoTickets);
    setActiveTickets(demoTickets.filter(t => 
      t.status === 'open' || t.status === 'in-progress' || t.status === 'on-hold'
    ));
    setCompletedTickets(demoTickets.filter(t => 
      t.status === 'completed' || t.status === 'closed'
    ));
  }, []);

  // Handler for adding a new ticket
  const handleCreateTicket = (ticketData: {
    title: string;
    description: string;
    clientId: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
  }) => {
    // In a real app, you'd call an API to create the ticket
    // For this demo, we'll just add it to the state
    const client = clients.find(c => c.id === ticketData.clientId);
    if (!client) return;

    const newTicket: ServiceTicket = {
      id: tickets.length + 1,
      title: ticketData.title,
      client: client.name,
      clientId: client.id,
      assignedTo: 'Jane Smith', // Default assignee
      status: 'open',
      priority: ticketData.priority,
      category: ticketData.category,
      createdAt: new Date(),
      dueDate: null,
    };

    setTickets([newTicket, ...tickets]);
    setActiveTickets([newTicket, ...activeTickets]);
  };

  // Handler for adding a comment
  const handleAddComment = (comment: { content: string; isInternal: boolean }) => {
    if (!selectedTicket) return;

    // In a real app, you'd call an API to add the comment
    const newComment: Comment = {
      id: comments.length + 1,
      content: comment.content,
      createdAt: new Date(),
      isInternal: comment.isInternal,
      user: {
        id: 1, // Current user ID
        name: 'Jane Smith', // Current user name
        email: 'jane@example.com', // Current user email
      },
    };

    setComments([newComment, ...comments]);
  };

  // Handler for logging time
  const handleLogTime = (timeEntry: {
    ticketId: number;
    clientId: number;
    description: string;
    startTime: Date;
    duration: number;
    billable: boolean;
  }) => {
    // In a real app, you'd call an API to log the time
    console.log('Time entry logged:', timeEntry);
    
    // Add a comment indicating time was logged
    const hours = Math.floor(timeEntry.duration / 60);
    const minutes = timeEntry.duration % 60;
    const timeString = hours > 0 
      ? `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}` 
      : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    
    handleAddComment({
      content: `Logged ${timeString} of work: ${timeEntry.description} ${timeEntry.billable ? '(Billable)' : '(Non-billable)'}`,
      isInternal: true
    });
  };
  
  // Handler for deleting a ticket
  const handleDeleteTicket = async (id: number) => {
    // In a real app, you'd call an API to delete the ticket
    // For this demo, we'll just remove it from the state
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Remove from all ticket lists
      setTickets(tickets.filter(ticket => ticket.id !== id));
      setActiveTickets(activeTickets.filter(ticket => ticket.id !== id));
      setCompletedTickets(completedTickets.filter(ticket => ticket.id !== id));
      
      // If this is the currently selected ticket, clear the selection
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket(null);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return Promise.reject(error);
    }
  };
  
  // Handler for adding an expense
  const handleAddExpense = (expense: {
    ticketId: number;
    description: string;
    amount: number;
    category: string;
    billable: boolean;
    receiptUrl?: string;
  }) => {
    // In a real app, you'd call an API to add an expense
    const newExpense: Expense = {
      id: expenses.length + 1,
      ...expense,
      date: new Date()
    };
    
    setExpenses([newExpense, ...expenses]);
    
    // Add a comment about the expense addition
    handleAddComment({
      content: `Added expense: ${expense.description} - $${expense.amount.toFixed(2)} (${expense.category}) ${expense.billable ? '(Billable)' : '(Non-billable)'}`,
      isInternal: true
    });
  };

  const columns = [
    {
      accessorKey: 'title',
      header: 'Ticket',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-primary/5 flex items-center justify-center text-gray-500 dark:text-primary mr-3">
            <Ticket className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-foreground">{row.original.title}</div>
            <div className="text-sm text-gray-500 dark:text-muted-foreground">
              {row.original.client}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[row.original.status]}`}>
            {row.original.status}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          {priorityIcons[row.original.priority]}
          <span className="ml-2 capitalize">{row.original.priority}</span>
        </div>
      ),
    },
    {
      accessorKey: 'assignedTo',
      header: 'Assigned To',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: any) => (
        <div className="text-gray-500 dark:text-muted-foreground">
          {formatDistanceToNow(row.original.createdAt, { addSuffix: true })}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row, table }: any) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  // Toggle selection - if already selected, deselect it; otherwise select it
                  setSelectedTicket(prev => prev?.id === row.original.id ? null : row.original);
                }}
                className="cursor-pointer flex items-center"
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>View details</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/tickets/${row.original.id}/edit`} className="cursor-pointer flex items-center">
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  // Select the ticket and show the time entry form
                  setSelectedTicket(row.original);
                }}
                className="cursor-pointer flex items-center"
              >
                <Clock className="mr-2 h-4 w-4" />
                <span>Log Time</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  // Mark ticket as complete
                  const updatedTickets = tickets.map(t => 
                    t.id === row.original.id ? { ...t, status: 'completed' as const } : t
                  );
                  setTickets(updatedTickets);
                  
                  // Update the filtered lists
                  setCompletedTickets([
                    ...completedTickets, 
                    { ...row.original, status: 'completed' as const }
                  ]);
                  setActiveTickets(activeTickets.filter(t => t.id !== row.original.id));
                  
                  // Add a status change comment
                  handleAddComment({
                    content: `Status changed to completed`,
                    isInternal: true
                  });
                  
                  // Add a status change to history
                  const newStatusChange: StatusChange = {
                    id: statusHistory.length + 1,
                    ticketId: row.original.id,
                    status: 'completed',
                    timestamp: new Date(),
                    user: {
                      id: 1, // Current user ID
                      name: 'Jane Smith', // Current user name
                    }
                  };
                  setStatusHistory([newStatusChange, ...statusHistory]);
                }}
                className="cursor-pointer flex items-center"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Complete</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 flex items-center cursor-pointer"
                onClick={() => {
                  const handleDelete = table.options.meta?.handleDelete as (id: number) => Promise<void>;
                  if (handleDelete) {
                    handleDelete(row.original.id);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];


  // Get the filtered data based on selected ticket
  const filteredComments = selectedTicket 
    ? comments.filter(comment => comment.ticketId === selectedTicket.id)
    : [];
    
  const filteredTimeEntries = selectedTicket
    ? timeEntries.filter(entry => entry.ticketId === selectedTicket.id)
    : [];
    
  const filteredExpenses = selectedTicket
    ? expenses.filter(expense => expense.ticketId === selectedTicket.id)
    : [];
    
  const filteredStatusHistory = selectedTicket
    ? statusHistory.filter(status => status.ticketId === selectedTicket.id)
    : [];
  
  // Create a component for the ticket data table
  const ticketsView = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Service Tickets</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="sm:max-w-[600px] bg-white dark:bg-background text-card-foreground dark:text-card-foreground shadow-md
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:slide-in-from-top-2 data-[state=open]:slide-in-from-right-2
            data-[state=closed]:slide-out-to-top-2 data-[state=closed]:slide-out-to-right-2
            border border-border dark:border-border/20 rounded-lg"
          >
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Create New Ticket</DialogTitle>
              <DialogDescription className="text-gray-700 dark:text-gray-300">
                Fill in the details below to create a new service ticket.
              </DialogDescription>
            </DialogHeader>
            <CreateTicketForm
              clients={clients}
              onCreateTicket={(data) => {
                handleCreateTicket(data);
                // Close dialog after submit (need to find the close button and click it)
                document.querySelector('[aria-label="Close"]')?.dispatchEvent(
                  new MouseEvent("click", { bubbles: true })
                );
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Tabs for ticket lists */}
      <Tabs defaultValue="active" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active ({activeTickets.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTickets.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <DataTable
            columns={columns}
            data={activeTickets}
            title="Active Tickets"
            searchPlaceholder="Search active tickets..."
            filterColumn="title"
            onDelete={handleDeleteTicket}
          />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <DataTable
            columns={columns}
            data={completedTickets}
            title="Completed Tickets"
            searchPlaceholder="Search completed tickets..."
            filterColumn="title"
            onDelete={handleDeleteTicket}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  // Conditionally render split view or just the table based on selection
  // Create context menu items for the DataTable that match the dropdown menu
  const contextMenuItems = (row: any) => {
    // Ensure row.original is available
    if (!row?.original) {
      console.error('Row original data missing in context menu');
      return null;
    }
    
    return (
      <>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem 
          className="cursor-pointer flex items-center"
          onClick={() => {
            // Toggle selection - if already selected, deselect; otherwise select
            setSelectedTicket(prev => prev?.id === row.original.id ? null : row.original);
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          <span>View details</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/tickets/${row.original.id}/edit`} className="cursor-pointer flex items-center">
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer flex items-center"
          onClick={() => {
            // Select the ticket and show the time entry form
            setSelectedTicket(row.original);
          }}
        >
          <Clock className="mr-2 h-4 w-4" />
          <span>Log Time</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer flex items-center"
          onClick={() => {
            // Mark ticket as complete
            const updatedTickets = tickets.map(t => 
              t.id === row.original.id ? { ...t, status: 'completed' as const } : t
            );
            setTickets(updatedTickets);
            
            // Update the filtered lists
            setCompletedTickets([
              ...completedTickets, 
              { ...row.original, status: 'completed' as const }
            ]);
            setActiveTickets(activeTickets.filter(t => t.id !== row.original.id));
            
            // Add a status change comment
            handleAddComment({
              content: `Status changed to completed`,
              isInternal: true
            });
            
            // Add a status change to history
            const newStatusChange: StatusChange = {
              id: statusHistory.length + 1,
              ticketId: row.original.id,
              status: 'completed',
              timestamp: new Date(),
              user: {
                id: 1, // Current user ID
                name: 'Jane Smith', // Current user name
              }
            };
            setStatusHistory([newStatusChange, ...statusHistory]);
          }}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>Complete</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-700 flex items-center cursor-pointer"
          onClick={() => {
            if (handleDeleteTicket) {
              handleDeleteTicket(row.original.id);
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </>
    );
  };

  // Update the DataTable components to include context menu items
  const activeTicketsTable = (
    <DataTable
      columns={columns}
      data={activeTickets}
      title="Active Tickets"
      searchPlaceholder="Search active tickets..."
      filterColumn="title"
      onDelete={handleDeleteTicket}
      contextMenuItems={contextMenuItems}
    />
  );

  const completedTicketsTable = (
    <DataTable
      columns={columns}
      data={completedTickets}
      title="Completed Tickets"
      searchPlaceholder="Search completed tickets..."
      filterColumn="title"
      onDelete={handleDeleteTicket}
      contextMenuItems={contextMenuItems}
    />
  );

  // Update the tickets view to use the tables with context menu
  const updatedTicketsView = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Service Tickets</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="sm:max-w-[600px] bg-white dark:bg-background text-card-foreground dark:text-card-foreground shadow-md
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:slide-in-from-top-2 data-[state=open]:slide-in-from-right-2
            data-[state=closed]:slide-out-to-top-2 data-[state=closed]:slide-out-to-right-2
            border border-border dark:border-border/20 rounded-lg"
          >
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Create New Ticket</DialogTitle>
              <DialogDescription className="text-gray-700 dark:text-gray-300">
                Fill in the details below to create a new service ticket.
              </DialogDescription>
            </DialogHeader>
            <CreateTicketForm
              clients={clients}
              onCreateTicket={(data) => {
                handleCreateTicket(data);
                // Close dialog after submit (need to find the close button and click it)
                document.querySelector('[aria-label="Close"]')?.dispatchEvent(
                  new MouseEvent("click", { bubbles: true })
                );
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Tabs for ticket lists */}
      <Tabs defaultValue="active" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active ({activeTickets.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTickets.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {activeTicketsTable}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {completedTicketsTable}
        </TabsContent>
      </Tabs>
    </div>
  );

  return selectedTicket ? (
    <SplitView 
      left={updatedTicketsView} 
      right={
        <TicketDetailPane 
          ticket={selectedTicket} 
          comments={filteredComments}
          timeEntries={filteredTimeEntries}
          expenses={filteredExpenses}
          statusHistory={filteredStatusHistory}
          onAddComment={handleAddComment}
          onLogTime={handleLogTime}
          onAddExpense={handleAddExpense}
        />
      } 
      leftWidth="3fr"
      rightWidth="2fr"
    />
  ) : (
    updatedTicketsView
  );
}