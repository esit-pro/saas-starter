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
  Calendar as CalendarIcon,
  Users,
  Circle as CircleIcon,
  User,
  DollarSign,
  Paperclip
} from 'lucide-react';
import { 
  getTicketsForTeam, 
  getTicketById, 
  createTicket, 
  updateTicket, 
  deleteTicket, 
  getClientsForSelection, 
  getTeamMembersForAssignment 
} from './actions';
import { SplitView } from '../../components/split-view';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import { TicketComments, Comment } from '../../components/ticket-comments';
import { TimeEntryForm } from '../../components/time-entry-form';
import { ExpenseForm } from '../../components/expense-form';
import { motion, AnimatePresence } from 'framer-motion';

// Service Ticket type definition
type ServiceTicket = {
  id: number;
  title: string;
  client: string;
  clientId: number;
  assignedTo: string;
  status: string; // Allow any string from the database
  priority: string; // Allow any string from the database
  category: string;
  description?: string | null;
  createdAt: Date;
  dueDate: Date | null;
};

// Client type
type Client = {
  id: number;
  name: string;
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
    ticketId: 1,
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
    ticketId: 1,
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
  ticketId: number | null;
  clientId: number;
  description: string;
  startTime: Date;
  duration: number; // in minutes
  billable: boolean;
  deletedAt?: Date | null;
  user: {
    id: number;
    name: string | null;
    email?: string;
  } | null;
};

type Expense = {
  id: number;
  ticketId: number | null;
  clientId: number;
  description: string;
  amount: string | number;  // Allow both string and number
  date: Date;
  category: string | null;  // Allow null
  billable: boolean;
  receiptUrl?: string | null;
  deletedAt?: Date | null;
  userId?: number;  // Make this optional to match demo data
  billed?: boolean; // Add this to match API response
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
    clientId: 1,  // Add clientId
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
  onLogTime,
  onAddExpense,
  onUpdateTicket,
  clients,
  teamMembers
}: { 
  ticket: ServiceTicket | null;
  comments: Comment[];
  timeEntries: TimeEntry[];
  expenses: Expense[];
  statusHistory: StatusChange[];
  clients: Client[];
  teamMembers?: { id: number; name: string; email: string }[];
  onLogTime: (timeEntry: any) => void;
  onAddExpense: (expense: { 
    ticketId: number;
    description: string;
    amount: number;
    category: string;
    billable: boolean;
    receiptUrl?: string;
  }) => void;
  onUpdateTicket: (id: number, data: Partial<ServiceTicket>) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<'activity' | 'time' | 'expenses'>('activity');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ServiceTicket>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // Reset state when ticket changes
    setIsEditing(false);
    setEditedData({});
    setIsSaving(false);
  }, [ticket?.id]);

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
  
  const handleChange = (field: keyof ServiceTicket, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSave = async () => {
    if (Object.keys(editedData).length === 0) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await onUpdateTicket(ticket.id, editedData);
      setIsEditing(false);
      setEditedData({});
      toast.success('Ticket updated successfully');
      
      // Add a status change to history if status was modified
      if (editedData.status && editedData.status !== ticket.status) {
        const newStatusChange: StatusChange = {
          id: statusHistory.length + 1,
          ticketId: ticket.id,
          status: editedData.status,
          timestamp: new Date(),
          user: {
            id: 1, // Current user ID - in real app get from auth
            name: 'Jane Smith', // Current user name - in real app get from auth
          }
        };
        
        // Update status history locally
        statusHistory.unshift(newStatusChange);
      }
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast.error('Failed to update ticket');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate total time spent
  const totalMinutes = timeEntries.reduce((acc, entry) => acc + entry.duration, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeSpentString = hours > 0 
    ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
    : `${minutes}m`;

  // Calculate total expenses
  const totalExpenses = expenses.reduce((acc, expense) => 
    acc + (typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount), 0);
  
  // Merge ticket data with edited data
  const displayData = {
    ...ticket,
    ...editedData
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 flex flex-col gap-6">
        {/* Ticket header with edit button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-primary/5 flex items-center justify-center text-gray-500 dark:text-primary mr-4">
              <Ticket className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between max-w-md">
                {isEditing ? (
                  <Input
                    value={displayData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="text-2xl font-bold h-auto py-1 px-2 bg-blue-50/30 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">{displayData.title}</h2>
                )}
                
                {isEditing ? (
                  <select
                    value={displayData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="ml-4 px-2.5 py-1 rounded-full text-sm font-medium capitalize bg-white dark:bg-zinc-800 border border-blue-300 dark:border-blue-700"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium capitalize ${statusColors[displayData.status]}`}>
                    {displayData.status}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-muted-foreground flex items-center flex-wrap gap-4 mt-1">
                <div className="flex items-center">
                  <span>Ticket #{ticket.id}</span>
                </div>
                <div className="flex items-center">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span>Client:</span>
                      <select
                        value={displayData.clientId}
                        onChange={(e) => handleChange('clientId', Number(e.target.value))}
                        className="bg-white dark:bg-zinc-800 rounded border border-blue-300 dark:border-blue-700 text-sm"
                      >
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span>Client: {displayData.client}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <span>Created {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedData({});
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="flex items-center"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Ticket details cards */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${isEditing ? 'border-2 border-blue-200 dark:border-blue-900/40 rounded-lg p-2' : ''}`}>
          <div className={`border dark:border-border rounded-lg p-4 ${isEditing ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3 flex items-center">
              Priority
              {isEditing && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Editing)</span>}
            </h3>
            <div className="flex items-center">
              {isEditing ? (
                <select
                  value={displayData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 rounded border border-blue-300 dark:border-blue-700 p-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              ) : (
                <>
                  {priorityIcons[displayData.priority]}
                  <span className="ml-2 font-medium capitalize text-gray-900 dark:text-foreground">{displayData.priority}</span>
                </>
              )}
            </div>
          </div>
          
          <div className={`border dark:border-border rounded-lg p-4 ${isEditing ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">Time Tracked</h3>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="font-medium text-gray-900 dark:text-foreground">
                {timeEntries.length > 0 ? timeSpentString : "No time entries"}
              </span>
            </div>
          </div>
          
          <div className={`border dark:border-border rounded-lg p-4 ${isEditing ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">
              {isEditing ? (
                <div className="flex items-center justify-between">
                  <span>Category</span>
                  {isEditing && <span className="text-xs text-blue-600 dark:text-blue-400">(Editing)</span>}
                </div>
              ) : (
                "Category"
              )}
            </h3>
            <div className="flex items-center">
              {isEditing ? (
                <Input
                  value={displayData.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="e.g., Hardware, Software, Network"
                  className="border-blue-300 dark:border-blue-700"
                />
              ) : (
                <span className="font-medium text-gray-900 dark:text-foreground">
                  {displayData.category || "Uncategorized"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        {(displayData.description || isEditing) && (
          <div className={`border dark:border-border rounded-lg p-4 ${isEditing ? 'bg-blue-50/30 dark:bg-blue-950/10 border-2 border-blue-200 dark:border-blue-900/40' : ''}`}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3 flex items-center">
              Description
              {isEditing && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Editing)</span>}
            </h3>
            {isEditing ? (
              <Textarea
                value={displayData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter detailed description of the issue"
                className="min-h-[120px] border-blue-300 dark:border-blue-700"
              />
            ) : (
              <div className="text-gray-900 dark:text-foreground whitespace-pre-wrap">
                {displayData.description || 'No description provided.'}
              </div>
            )}
          </div>
        )}

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
                  comments={comments.filter(c => c.ticketId === ticket.id)}
                  onCommentAdded={(comment) => {
                    // Handle comment added at the detail pane level if needed
                    console.log('Comment added:', comment);
                  }}
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
                                {entry.user?.name || 'Unknown'} • {formatDistanceToNow(entry.startTime, { addSuffix: true })}
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
                  clientId={ticket.clientId}
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
                              ${typeof expense.amount === 'number' 
                                ? expense.amount.toFixed(2) 
                                : parseFloat(String(expense.amount)).toFixed(2)}
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
  const [clients, setClients] = useState<Client[]>([]);
  
  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const result = await getClientsForSelection();
        if (result.error) {
          console.error('Error fetching clients:', result.error);
          // Keep demo clients as fallback if needed
          setClients(demoClients);
        } else if (result.clients) {
          setClients(result.clients);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
        // Use demo clients as fallback
        setClients(demoClients);
      }
    };
    
    fetchClients();
  }, []);

  // Define a handler for row clicks
  const handleRowClick = (row: any) => {
    setSelectedTicket(row);
  };
  
  // Create context menu items for the DataTable
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
              ticketId: row.original.id,
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
  useEffect(() => {
    // Fetch tickets from the server
    async function fetchTickets() {
      try {
        const result = await getTicketsForTeam();
        
        if (result.error) {
          console.error('Error fetching tickets:', result.error);
          return;
        }
        
        if (result.tickets) {
          setTickets(result.tickets);
          setActiveTickets(result.tickets.filter(t => 
            t.status === 'open' || t.status === 'in-progress' || t.status === 'on-hold'
          ));
          setCompletedTickets(result.tickets.filter(t => 
            t.status === 'completed' || t.status === 'closed'
          ));
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      }
    }
    
    fetchTickets();
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

  // Handler for adding a comment (now a callback from TicketComments)
  const handleAddComment = (commentData: Partial<Comment> & { content: string }) => {
    // Create a proper Comment object with all required fields
    const newComment: Comment = {
      id: Date.now(), // Temporary ID until synced with server
      ticketId: selectedTicket?.id || commentData.ticketId || 0,
      content: commentData.content,
      createdAt: new Date(),
      isInternal: commentData.isInternal || false,
      user: {
        id: 1, // Current user ID (should be replaced with actual user data)
        name: 'Current User', // Placeholder (should be replaced with actual user data)
        email: 'user@example.com' // Placeholder (should be replaced with actual user data)
      }
    };

    setComments([...comments, newComment]);
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
    // This function is called by the TimeEntryForm component after a successful API call
    // The API call is handled in the TimeEntryForm component itself
    // Here we're just updating our local state with the new entry for immediate UI update
    
    // Create a new entry for the local state
    const newTimeEntry: TimeEntry = {
      id: timeEntries.length + 1, // In real app, this would come from the server response
      ticketId: timeEntry.ticketId,
      clientId: timeEntry.clientId,
      description: timeEntry.description,
      startTime: timeEntry.startTime,
      duration: timeEntry.duration,
      billable: timeEntry.billable,
      user: {
        id: 1, // Current user ID - in real app from auth
        name: 'Jane Smith', // Current user name - in real app from auth
      }
    };
    
    // Update the local state
    setTimeEntries([newTimeEntry, ...timeEntries]);
    
    // Add a comment for time entry
    const hours = Math.floor(timeEntry.duration / 60);
    const minutes = timeEntry.duration % 60;
    const timeString = hours > 0 
      ? `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}` 
      : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    
    handleAddComment({
      ticketId: timeEntry.ticketId,
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
    // This function is called by the ExpenseForm component after a successful API call
    // The API call is handled in the ExpenseForm component itself
    // Here we're just updating our local state with the new expense for immediate UI update
    
    // Create a new expense for the local state
    const newExpense: Expense = {
      id: expenses.length + 1, // In real app, this would come from the server response
      ticketId: expense.ticketId,
      clientId: selectedTicket?.clientId || 1, // Use ticket's client ID or a fallback
      description: expense.description,
      amount: expense.amount,
      date: new Date(),
      category: expense.category,
      billable: expense.billable,
      receiptUrl: expense.receiptUrl
    };
    
    // Update the local state
    setExpenses([newExpense, ...expenses]);
    
    // Add a comment for the expense
    handleAddComment({
      ticketId: expense.ticketId,
      content: `Added expense: ${expense.description} - $${typeof expense.amount === 'number' 
        ? expense.amount.toFixed(2) 
        : expense.amount} ${expense.billable ? '(Billable)' : '(Non-billable)'}`,
      isInternal: true
    });
  };
  
  // Handler for updating a ticket
  const handleUpdateTicket = async (id: number, data: Partial<ServiceTicket>) => {
    try {
      // Combine basic data with required fields
      const ticket = tickets.find(t => t.id === id);
      if (!ticket) {
        toast.error('Ticket not found');
        return Promise.reject('Ticket not found');
      }
      
      // Create the full update payload
      const updateData = {
        id,
        title: data.title || ticket.title,
        description: data.description !== undefined ? data.description : ticket.description,
        clientId: data.clientId || ticket.clientId,
        status: data.status || ticket.status as 'open' | 'in-progress' | 'on-hold' | 'completed' | 'closed',
        priority: data.priority || ticket.priority as 'low' | 'medium' | 'high' | 'critical',
        category: data.category !== undefined ? data.category : ticket.category,
        assignedTo: data.assignedTo !== undefined ? data.assignedTo : ticket.assignedTo,
        dueDate: data.dueDate !== undefined ? data.dueDate : ticket.dueDate
      };
      
      // Create form data for the API call
      const formData = new FormData();
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // In a real app, we'd call the API
      console.log('Updating ticket with data:', updateData);
      const result = await updateTicket(updateData, formData);
      
      if (result.error) {
        toast.error(result.error);
        return Promise.reject(result.error);
      }
      
      if (result.success) {
        // Update the ticket in the local state
        const updatedTickets = tickets.map(t => 
          t.id === id 
            ? { 
                ...t, 
                ...data,
                // Handle special case for client name
                client: data.clientId 
                  ? clients.find(c => c.id === data.clientId)?.name || t.client 
                  : t.client
              } 
            : t
        );
        
        // Update all state
        setTickets(updatedTickets);
        
        // Update filtered lists
        const updatedTicket = updatedTickets.find(t => t.id === id);
        if (updatedTicket) {
          if (updatedTicket.status === 'completed' || updatedTicket.status === 'closed') {
            // Move to completed list if needed
            if (!completedTickets.some(t => t.id === id)) {
              setCompletedTickets([updatedTicket, ...completedTickets.filter(t => t.id !== id)]);
              setActiveTickets(activeTickets.filter(t => t.id !== id));
            } else {
              // Update in completed list
              setCompletedTickets(completedTickets.map(t => t.id === id ? updatedTicket : t));
            }
          } else {
            // Move to active list if needed
            if (!activeTickets.some(t => t.id === id)) {
              setActiveTickets([updatedTicket, ...activeTickets.filter(t => t.id !== id)]);
              setCompletedTickets(completedTickets.filter(t => t.id !== id));
            } else {
              // Update in active list
              setActiveTickets(activeTickets.map(t => t.id === id ? updatedTicket : t));
            }
          }
        }
        
        // Update selected ticket if it's the one we're viewing
        if (selectedTicket?.id === id) {
          setSelectedTicket(updatedTicket || null);
        }
        
        return Promise.resolve();
      }
      
      return Promise.reject('Unknown error updating ticket');
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
      return Promise.reject(error);
    }
  };

  const columns = [
    {
      accessorKey: 'title',
      header: 'Ticket',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-primary/5 flex items-center justify-center text-gray-500 dark:text-primary mr-3 flex-shrink-0">
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
        <div className="flex items-center">
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
      cell: ({ row }: any) => (
        <div className="flex items-center">
          {row.original.assignedTo}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: any) => (
        <div className="flex items-center text-gray-500 dark:text-muted-foreground">
          {formatDistanceToNow(row.original.createdAt, { addSuffix: true })}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row, table }: any) => (
        <div className="flex justify-end">
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
                  
                  // No need for manual comment - the updateTicket action will log the activity
                  
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


  // Fetch ticket details, time entries, and expenses when a ticket is selected
  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!selectedTicket) return;
      
      try {
        // Fetch the full ticket details including time entries and expenses
        const result = await getTicketById(selectedTicket.id);
        
        if (result.error) {
          console.error('Error fetching ticket details:', result.error);
          return;
        }
        
        if (result.ticket) {
          // Update time entries if available
          if (result.timeEntries) {
            setTimeEntries(prevEntries => {
              // Merge with existing entries, prioritizing the new ones
              const newEntryIds = new Set(result.timeEntries.map((entry: TimeEntry) => entry.id));
              const filteredOldEntries = prevEntries.filter(entry => 
                entry.ticketId !== selectedTicket.id || !newEntryIds.has(entry.id)
              );
              return [...result.timeEntries, ...filteredOldEntries];
            });
          }
          
          // Update expenses if available
          if (result.expenses) {
            setExpenses(prevExpenses => {
              // Merge with existing expenses, prioritizing the new ones
              const newExpenseIds = new Set(result.expenses.map((expense: Expense) => expense.id));
              const filteredOldExpenses = prevExpenses.filter(expense => 
                expense.ticketId !== selectedTicket.id || !newExpenseIds.has(expense.id)
              );
              return [...result.expenses, ...filteredOldExpenses];
            });
          }
          
          // Update comments if available
          if (result.ticket.comments) {
            setComments(prevComments => {
              // Merge with existing comments, prioritizing the new ones
              const newCommentIds = new Set(result.ticket.comments.map((comment: Comment) => comment.id));
              const filteredOldComments = prevComments.filter(comment => 
                comment.ticketId !== selectedTicket.id || !newCommentIds.has(comment.id)
              );
              return [...result.ticket.comments, ...filteredOldComments];
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch ticket details:', error);
      }
    };
    
    fetchTicketDetails();
  }, [selectedTicket?.id, selectedTicket]);

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
            className="sm:max-w-[600px] bg-gray-100 dark:bg-zinc-900/90 dark:backdrop-blur-md text-card-foreground dark:text-card-foreground shadow-md
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:slide-in-from-top-2 data-[state=open]:slide-in-from-right-2
            data-[state=closed]:slide-out-to-top-2 data-[state=closed]:slide-out-to-right-2
            border border-border dark:border-border/40 rounded-lg"
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
            contextMenuItems={contextMenuItems}
            onRowClick={handleRowClick}
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
            contextMenuItems={contextMenuItems}
            onRowClick={handleRowClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  // Conditionally render split view or just the table based on selection

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
      onRowClick={handleRowClick}
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
      onRowClick={handleRowClick}
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
            className="sm:max-w-[600px] bg-gray-100 dark:bg-zinc-900/90 dark:backdrop-blur-md text-card-foreground dark:text-card-foreground shadow-md
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:slide-in-from-top-2 data-[state=open]:slide-in-from-right-2
            data-[state=closed]:slide-out-to-top-2 data-[state=closed]:slide-out-to-right-2
            border border-border dark:border-border/40 rounded-lg"
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

  return (
    <div className="relative">
      {updatedTicketsView}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-2/5 bg-gray-100 dark:bg-zinc-900/90 dark:backdrop-blur-md border-l dark:border-border/40 shadow-lg overflow-auto"
            style={{ zIndex: 10 }}
          >
            <div className="flex justify-between items-center p-4 border-b dark:border-border">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Ticket Details</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedTicket(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="p-4">
              <TicketDetailPane 
                ticket={selectedTicket}
                comments={comments.filter(c => c.ticketId === selectedTicket.id)}
                timeEntries={timeEntries.filter(t => t.ticketId === selectedTicket.id)}
                expenses={expenses.filter(e => e.ticketId === selectedTicket.id)}
                statusHistory={statusHistory.filter(s => s.ticketId === selectedTicket.id)}
                onLogTime={handleLogTime}
                onAddExpense={handleAddExpense}
                onUpdateTicket={handleUpdateTicket}
                clients={clients}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}