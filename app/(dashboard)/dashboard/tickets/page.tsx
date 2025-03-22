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
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketsForTeam,
  getClientsForSelection,
  getTeamMembersForAssignment,
  deleteTimeEntry,
  addTicketComment
} from './actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { DataTable } from '../../components/data-table';
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
import { TicketComments, Comment as BaseComment } from '../../components/ticket-comments';
import { TimeEntryForm } from '../../components/time-entry-form';
import { ExpenseForm } from '../../components/expense-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

// Define the ServiceTicket type more accurately to match what comes from the database
type ServiceTicket = {
  id: number;
  teamId: number;
  clientId: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  assignedTo: number | null;
  dueDate: Date | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  deletedAt: Date | null;
  client: {
    id: number;
    name: string;
  };
  assignedUser: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdByUser: {
    id: number;
    name: string;
    email: string;
  };
};

// Client type
type Client = {
  id: number;
  name: string;
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
  billed: boolean;
  user: {
    id: number;
    name: string;
  };
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
  billed: boolean; // Add this to match schema
  receiptUrl?: string | null;
  deletedAt?: Date | null;
  userId?: number;  // Make this optional to match demo data
};

// UI helper constants
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

// Extend the base Comment type to include additional fields that may be coming from the server
type Comment = BaseComment & {
  updatedAt?: Date;
  attachments?: any;
  teamId?: number;
  createdBy?: number | null;
};

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
  onDeleteTimeEntry,
  clients,
  teamMembers,
  onCommentAdded,
  isEditing,
  setIsEditing
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
  onDeleteTimeEntry: (id: number) => Promise<void>;
  onCommentAdded: (commentData: Partial<Comment> & { content: string }) => void;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [activeTab, setActiveTab] = useState<'activity' | 'time' | 'expenses'>('activity');
  const [editedData, setEditedData] = useState<Partial<ServiceTicket>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // Reset state when ticket changes
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
      <div className="p-6 flex flex-col gap-8">
        {/* Ticket header with edit button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-primary/5 flex items-center justify-center text-gray-500 dark:text-primary mr-6">
              <Ticket className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between max-w-xl">
                {isEditing ? (
                  <div className="flex flex-col gap-3 w-full max-w-xl">
                    <Input
                      value={displayData.title || ''}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="text-2xl font-bold h-auto py-2 px-3 bg-blue-50/30 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700"
                    />
                    <div className="flex gap-3 justify-end mt-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setEditedData({});
                        }}
                        disabled={isSaving}
                        className="h-8"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        variant="primary" 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-8"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">{displayData.title}</h2>
                )}
                
                <div className="flex items-center">
                  {isEditing ? (
                    <select
                      value={displayData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium capitalize bg-white dark:bg-zinc-800 border border-blue-300 dark:border-blue-700 min-w-[140px]"
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
                  
                  {!isEditing && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center ml-3"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-muted-foreground flex items-center flex-wrap gap-4 mt-1">
                <div className="flex items-center">
                  <span>Ticket #{ticket.id}</span>
                </div>
                <div className="flex items-center">
                  {isEditing ? (
                    <div className="flex items-center gap-3">
                      <span>Client:</span>
                      <select
                        value={displayData.clientId}
                        onChange={(e) => handleChange('clientId', Number(e.target.value))}
                        className="bg-white dark:bg-zinc-800 rounded border text-sm border-blue-300 dark:border-blue-700 p-1.5 min-w-[180px]"
                      >
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span>Client: {typeof displayData.client === 'object' ? displayData.client.name : displayData.client}</span>
                  )}
                </div>
                <div className="flex items-center">
                  <span>Created {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            {/* Edit buttons moved to status line */}
          </div>
        </div>

        {/* Ticket details cards */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isEditing ? 'rounded-lg p-4 bg-gray-50 dark:bg-zinc-800/30' : ''}`}>
          <div className={`border dark:border-border rounded-lg p-5`}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3 flex items-center">
              Priority
            </h3>
            <div className="flex items-center">
              {isEditing ? (
                <select
                  value={displayData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 rounded border p-2 border-blue-300 dark:border-blue-700 mt-1"
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
          
          <div className={`border dark:border-border rounded-lg p-5`}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">Time Tracked</h3>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="font-medium text-gray-900 dark:text-foreground">
                {timeEntries.length > 0 ? timeSpentString : "No time entries"}
              </span>
            </div>
          </div>
          
          <div className={`border dark:border-border rounded-lg p-5`}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">
              Category
            </h3>
            <div className="flex items-center">
              {isEditing ? (
                <Input
                  value={displayData.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="e.g., Hardware, Software, Network"
                  className="border-blue-300 dark:border-blue-700 mt-1"
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
          <div className={`border dark:border-border rounded-lg p-5 ${isEditing ? 'bg-gray-50 dark:bg-zinc-800/30' : ''}`}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3 flex items-center">
              Description
            </h3>
            {isEditing ? (
              <Textarea
                value={displayData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter detailed description of the issue"
                className="min-h-[120px] border-blue-300 dark:border-blue-700 mt-2"
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
              <div className="border dark:border-border rounded-lg p-5 bg-white dark:bg-zinc-800/30">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-5">Status History</h3>
                
                <div className="space-y-5">
                  {statusHistory.map((change) => (
                    <div key={change.id} className="relative pl-8 pb-5 last:pb-0 border-l dark:border-border">
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
              <div className="border dark:border-border rounded-lg p-5 bg-white dark:bg-zinc-800/30">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-5">Comments</h3>
                <TicketComments
                  ticketId={ticket.id}
                  comments={comments.filter(c => c.ticketId === ticket.id)}
                  onCommentAdded={onCommentAdded}
                />
              </div>
            </div>
          )}

          {activeTab === 'time' && (
            <div className="space-y-6">
              {/* Time log form */}
              <div className="border dark:border-border rounded-lg p-5 bg-white dark:bg-zinc-800/30">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-5">Log Time</h3>
                <TimeEntryForm
                  ticketId={ticket.id}
                  clientId={ticket.clientId}
                  onLogTime={onLogTime}
                />
              </div>
              
              {/* Time entries list */}
              <div className="border dark:border-border rounded-lg p-5 bg-white dark:bg-zinc-800/30">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-5">
                  Time Entries {timeEntries.length > 0 && `(${timeSpentString} total)`}
                </h3>
                
                {timeEntries.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No time entries logged yet</p>
                ) : (
                  <div className="space-y-5">
                    {timeEntries.map((entry) => {
                      const entryHours = Math.floor(entry.duration / 60);
                      const entryMinutes = entry.duration % 60;
                      const durationStr = entryHours > 0 
                        ? `${entryHours}h ${entryMinutes > 0 ? `${entryMinutes}m` : ''}`
                        : `${entryMinutes}m`;
                        
                      return (
                        <div key={entry.id} className="flex items-start border-b dark:border-border pb-5 last:border-0 last:pb-0">
                          <div className="w-12 h-12 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                            <Clock className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900 dark:text-foreground">
                                {entry.description}
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm text-gray-500 dark:text-muted-foreground mr-2">
                                  {durationStr}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                  onClick={() => onDeleteTimeEntry(entry.id)}
                                  title="Delete time entry"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete time entry</span>
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                              <span className="font-medium">{entry.user?.name}</span>
                              <span className="mx-1">·</span>
                              <span>{new Date(entry.startTime).toLocaleString()}</span>
                              <span className="mx-1">·</span>
                              <span className={entry.billable ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                                {entry.billable ? 'Billable' : 'Non-billable'}
                              </span>
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
              <div className="border dark:border-border rounded-lg p-5 bg-white dark:bg-zinc-800/30">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-5">Add Expense</h3>
                <ExpenseForm 
                  ticketId={ticket.id}
                  clientId={ticket.clientId}
                  onAddExpense={onAddExpense}
                />
              </div>
              
              {/* Expenses list */}
              <div className="border dark:border-border rounded-lg p-5 bg-white dark:bg-zinc-800/30">
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-5">
                  Expenses {expenses.length > 0 && `($${totalExpenses.toFixed(2)} total)`}
                </h3>
                
                {expenses.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No expenses recorded yet</p>
                ) : (
                  <div className="space-y-5">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="flex items-start border-b dark:border-border pb-5 last:border-0 last:pb-0">
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
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: number; name: string; email: string }[]>([]);
  const searchParams = useSearchParams();
  const ticketIdFromUrl = searchParams.get('id');
  
  // Reset editing state when selectedTicket changes
  useEffect(() => {
    setIsEditing(false);
  }, [selectedTicket]);
  
  // Fetch clients and team members
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const clientsResult = await getClientsForSelection();
        if (clientsResult.error) {
          console.error('Error fetching clients:', clientsResult.error);
        } else if (clientsResult.clients) {
          setClients(clientsResult.clients);
        }
        
        // Fetch team members
        const teamMembersResult = await getTeamMembersForAssignment();
        if (teamMembersResult.error) {
          console.error('Error fetching team members:', teamMembersResult.error);
        } else if (teamMembersResult.members) {
          setTeamMembers(teamMembersResult.members.map(member => ({
            ...member,
            name: member.name || 'Unknown'
          })));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Fetch tickets from the server
  useEffect(() => {
    async function fetchTickets() {
      try {
        const result = await getTicketsForTeam(new FormData());
        
        if (result.error) {
          console.error('Error fetching tickets:', result.error);
          return;
        }
        
        if (result.tickets) {
          const ticketsWithMetadata = result.tickets.map(ticket => {
            // Ensure client has the expected structure
            const client = (() => {
              if (!ticket.client) return { id: 0, name: 'Unknown' };
              
              // Check if client is an array
              if (Array.isArray(ticket.client)) {
                return ticket.client.length > 0 
                  ? { id: Number(ticket.client[0].id) || 0, name: String(ticket.client[0].name) || 'Unknown' }
                  : { id: 0, name: 'Unknown' };
              }
              
              // Client is an object
              return { 
                id: Number(ticket.client.id) || 0, 
                name: String(ticket.client.name) || 'Unknown'
              };
            })();
            
            // Ensure assignedUser has the expected structure or is null
            const assignedUser = (() => {
              if (!ticket.assignedUser) return null;
              
              // Check if assignedUser is an array
              if (Array.isArray(ticket.assignedUser)) {
                return ticket.assignedUser.length > 0 
                  ? {
                      id: Number(ticket.assignedUser[0].id) || 0,
                      name: String(ticket.assignedUser[0].name) || 'Unknown',
                      email: String(ticket.assignedUser[0].email) || ''
                    }
                  : null;
              }
              
              // assignedUser is an object
              return {
                id: Number(ticket.assignedUser.id) || 0,
                name: String(ticket.assignedUser.name) || 'Unknown',
                email: String(ticket.assignedUser.email) || ''
              };
            })();
            
            // Ensure createdByUser has the expected structure
            const createdByUser = (() => {
              if (!ticket.createdByUser) return { id: 0, name: 'Unknown', email: '' };
              
              // Check if createdByUser is an array
              if (Array.isArray(ticket.createdByUser)) {
                return ticket.createdByUser.length > 0 
                  ? {
                      id: Number(ticket.createdByUser[0].id) || 0,
                      name: String(ticket.createdByUser[0].name) || 'Unknown',
                      email: String(ticket.createdByUser[0].email) || ''
                    }
                  : { id: 0, name: 'Unknown', email: '' };
              }
              
              // createdByUser is an object
              return {
                id: Number(ticket.createdByUser.id) || 0,
                name: String(ticket.createdByUser.name) || 'Unknown',
                email: String(ticket.createdByUser.email) || ''
              };
            })();
            
            // Define the base return object with all required properties
            const formattedTicket: ServiceTicket = {
              id: Number(ticket.id) || 0,
              teamId: Number(ticket.teamId) || 0,
              clientId: Number(ticket.clientId) || 0,
              title: String(ticket.title) || '',
              description: ticket.description || null,
              status: String(ticket.status) || 'open',
              priority: String(ticket.priority) || 'medium',
              category: ticket.category || null,
              assignedTo: ticket.assignedTo ? Number(ticket.assignedTo) : null,
              dueDate: ticket.dueDate ? new Date(ticket.dueDate) : null,
              createdBy: Number(ticket.createdBy) || 0,
              createdAt: new Date(ticket.createdAt),
              updatedAt: new Date(ticket.updatedAt),
              closedAt: ticket.closedAt ? new Date(ticket.closedAt) : null,
              deletedAt: ticket.deletedAt ? new Date(ticket.deletedAt) : null,
              client,
              assignedUser,
              createdByUser
            };
            
            return formattedTicket;
          });
          
          setTickets(ticketsWithMetadata);
          setActiveTickets(ticketsWithMetadata.filter(t => 
            t.status === 'open' || t.status === 'in-progress' || t.status === 'on-hold'
          ));
          setCompletedTickets(ticketsWithMetadata.filter(t => 
            t.status === 'completed' || t.status === 'closed'
          ));

          // Check if we need to select a specific ticket from URL
          if (ticketIdFromUrl) {
            const ticketId = parseInt(ticketIdFromUrl);
            const ticketToSelect = ticketsWithMetadata.find(t => t.id === ticketId);
            if (ticketToSelect) {
              setSelectedTicket(ticketToSelect);
              // If the ticket is completed or closed, switch to the completed tab
              if (ticketToSelect.status === 'completed' || ticketToSelect.status === 'closed') {
                setSelectedTab('completed');
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
        toast.error('Failed to load tickets');
      }
    }

    fetchTickets();
  }, [ticketIdFromUrl]);

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
          onClick={() => {
            // Toggle selection - if already selected, deselect it; otherwise select it
            setSelectedTicket(prev => prev?.id === row.original.id ? null : row.original);
          }}
          className="cursor-pointer flex items-center"
        >
          <Eye className="mr-2 h-4 w-4" />
          <span>View details</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => {
            // Select the ticket, open the detail panel, and activate edit mode
            setSelectedTicket(row.original);
            // We need to wait for selectedTicket to be set before setting edit mode
            setTimeout(() => {
              setIsEditing(true);
            }, 100);
          }}
          className="cursor-pointer flex items-center"
        >
          <Pencil className="mr-2 h-4 w-4" />
          <span>Edit</span>
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

  // Handler for adding a new ticket
  const handleCreateTicket = async (ticketData: {
    title: string;
    description: string;
    clientId: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
  }) => {
    try {
      const formData = new FormData();
      Object.entries(ticketData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      
      const result = await createTicket(ticketData, formData);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.ticket) {
        // Update ticket with full details
        const formattedTicket: ServiceTicket = {
          ...result.ticket,
          clientId: result.ticket.clientId || 0,
          client: (result.ticket as any).client || { id: 0, name: 'Unknown' },
          createdBy: result.ticket.createdBy || 0,
          createdByUser: (result.ticket as any).createdByUser 
            ? { 
                id: (result.ticket as any).createdByUser.id, 
                name: (result.ticket as any).createdByUser.name || 'Unknown', 
                email: (result.ticket as any).createdByUser.email 
              }
            : { id: 0, name: 'Unknown', email: '' },
          assignedUser: (result.ticket as any).assignedUser 
            ? {
                id: (result.ticket as any).assignedUser.id,
                name: (result.ticket as any).assignedUser.name || 'Unknown',
                email: (result.ticket as any).assignedUser.email
              }
            : null
        };
        setSelectedTicket(formattedTicket);
        toast.success('Ticket created successfully');
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  // Handler for adding a comment (now a callback from TicketComments)
  const handleAddComment = async (commentData: Partial<Comment> & { content: string }) => {
    if (!commentData.content.trim()) {
      return; // Don't submit empty comments
    }
    
    try {
      const formData = new FormData();
      formData.append('ticketId', String(selectedTicket?.id || commentData.ticketId || 0));
      formData.append('content', commentData.content);
      formData.append('isInternal', String(commentData.isInternal || false));
      
      const result = await addTicketComment(
        { ticketId: selectedTicket?.id || commentData.ticketId || 0 },
        formData
      );
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.comment) {
        // Add the new comment to the state
        setComments(prev => [...prev, result.comment]);
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
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
      billed: false,
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
    try {
      // Validate the ID is a valid number
      if (typeof id !== 'number' || isNaN(id) || id <= 0) {
        console.error('Invalid ticket ID for deletion:', id);
        toast.error('Error deleting ticket: Invalid ID');
        return Promise.reject('Invalid ticket ID');
      }
      
      // Call the server action to delete the ticket
      const result = await deleteTicket({ id }, new FormData());
      
      if (result.error) {
        toast.error(result.error);
        return Promise.reject(result.error);
      }
      
      if (result.success) {
        // Remove from all ticket lists
        setTickets(tickets.filter(ticket => ticket.id !== id));
        setActiveTickets(activeTickets.filter(ticket => ticket.id !== id));
        setCompletedTickets(completedTickets.filter(ticket => ticket.id !== id));
        
        // If this is the currently selected ticket, clear the selection
        if (selectedTicket && selectedTicket.id === id) {
          setSelectedTicket(null);
        }
        
        // If the ticket had unbilled items, show a more detailed success message
        if (result.hasUnbilledItems) {
          const timeEntriesMsg = result.unbilledTimeEntries > 0 
            ? `${result.unbilledTimeEntries} time ${result.unbilledTimeEntries === 1 ? 'entry' : 'entries'}` 
            : '';
          const expensesMsg = result.unbilledExpenses > 0 
            ? `${result.unbilledExpenses} ${result.unbilledExpenses === 1 ? 'expense' : 'expenses'}` 
            : '';
          const andMsg = timeEntriesMsg && expensesMsg ? ' and ' : '';
          
          toast.success(
            `Ticket deleted. You still have ${timeEntriesMsg}${andMsg}${expensesMsg} that can be billed to the client.`,
            { duration: 6000 }
          );
        } else {
          toast.success("Ticket deleted successfully");
        }
        
        return Promise.resolve();
      }
      
      return Promise.reject("Failed to delete ticket");
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
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
      date: (expense as any).date || (expense as any).createdAt || new Date(),
      category: expense.category,
      billable: expense.billable,
      billed: false,
      receiptUrl: expense.receiptUrl,
      userId: (expense as any).userId || undefined
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
                // Handle special case for client
                client: data.clientId 
                  ? { 
                      id: data.clientId, 
                      name: clients.find(c => c.id === data.clientId)?.name || 'Unknown' 
                    }
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

  // Add handler for deleting time entries
  const handleDeleteTimeEntry = async (id: number) => {
    try {
      const result = await deleteTimeEntry({ id }, new FormData());
      
      if (result.error) {
        toast.error(result.error);
        return Promise.reject(result.error);
      }
      
      if (result.success) {
        toast.success(result.success);
        // Update the local state by removing the deleted entry
        setTimeEntries(timeEntries.filter(entry => entry.id !== id));
        return Promise.resolve();
      }
      
      return Promise.reject("Unknown error");
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast.error('Failed to delete time entry');
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
              {row.original.client?.name || 'Unknown Client'}
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
          {row.original.assignedUser ? row.original.assignedUser.name : 'Unassigned'}
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
              <DropdownMenuItem 
                onClick={() => {
                  // Select the ticket, open the detail panel, and activate edit mode
                  setSelectedTicket(row.original);
                  // We need to wait for selectedTicket to be set before setting edit mode
                  setTimeout(() => {
                    setIsEditing(true);
                  }, 100);
                }}
                className="cursor-pointer flex items-center"
              >
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
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
        console.log('Fetching ticket details for:', selectedTicket.id);
        const result = await getTicketById(selectedTicket.id, new FormData());
        
        if (result.error) {
          toast.error(result.error);
          return;
        }
        
        // Update ticket with full details
        if (result.ticket) {
          const formattedTicket: ServiceTicket = {
            ...result.ticket,
            clientId: result.ticket.clientId || 0,
            client: (result.ticket as any).client || { id: 0, name: 'Unknown' },
            createdBy: result.ticket.createdBy || 0,
            createdByUser: (result.ticket as any).createdByUser 
              ? { 
                  id: (result.ticket as any).createdByUser.id, 
                  name: (result.ticket as any).createdByUser.name || 'Unknown', 
                  email: (result.ticket as any).createdByUser.email 
                }
              : { id: 0, name: 'Unknown', email: '' },
            assignedUser: (result.ticket as any).assignedUser 
              ? {
                  id: (result.ticket as any).assignedUser.id,
                  name: (result.ticket as any).assignedUser.name || 'Unknown',
                  email: (result.ticket as any).assignedUser.email
                }
              : null
          };
          setSelectedTicket(formattedTicket);
        }
        
        // Update comments, timeEntries, and expenses
        if (result.comments) {
          setComments(prevComments => {
            // Keep old comments for other tickets, add new ones for this ticket
            const filteredOldComments = prevComments.filter(comment => comment.ticketId !== selectedTicket.id);
            
            // Properly format new comments to match the Comment type
            const formattedComments = result.comments.map(comment => {
              const formattedUser = (() => {
                if (!comment.user) return { id: 0, name: 'Unknown', email: '' };
                
                // Check if user is an array
                if (Array.isArray(comment.user)) {
                  return comment.user.length > 0 
                    ? {
                        id: Number(comment.user[0].id) || 0,
                        name: String(comment.user[0].name) || 'Unknown',
                        email: String(comment.user[0].email) || ''
                      }
                    : { id: 0, name: 'Unknown', email: '' };
                }
                
                // User is an object
                return {
                  id: Number(comment.user.id) || 0,
                  name: String(comment.user.name) || 'Unknown',
                  email: String(comment.user.email) || ''
                };
              })();
              
              return {
                id: Number(comment.id) || 0,
                ticketId: Number(comment.ticketId) || 0,
                content: String(comment.content) || '',
                attachments: comment.attachments || null,
                isInternal: Boolean(comment.isInternal),
                createdAt: new Date(comment.createdAt),
                updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : new Date(comment.createdAt),
                createdBy: comment.createdBy !== undefined ? Number(comment.createdBy) : null,
                teamId: Number(comment.teamId) || 0,
                user: formattedUser
              } as Comment;
            });
            
            return [...formattedComments, ...filteredOldComments];
          });
        }
        
        if (result.timeEntries) {
          setTimeEntries(prevEntries => {
            // Keep old entries for other tickets, add new ones for this ticket
            const filteredOldEntries = prevEntries.filter(entry => entry.ticketId !== selectedTicket.id);
            const formattedTimeEntries = result.timeEntries.map(entry => ({
              id: entry.id,
              ticketId: entry.ticketId || selectedTicket.id,
              clientId: entry.clientId || selectedTicket.clientId,
              description: entry.description || '',
              startTime: entry.startTime || new Date(),
              duration: entry.duration || 0,
              billable: entry.billable || false,
              billed: entry.billed || false,
              user: entry.user ? {
                id: entry.user.id, 
                name: entry.user.name || 'Unknown'
              } : { id: 0, name: 'Unknown' }
            }));
            return [...formattedTimeEntries, ...filteredOldEntries];
          });
        }
        
        if (result.expenses) {
          setExpenses(prevExpenses => {
            // Keep old expenses for other tickets, add new ones for this ticket
            const filteredOldExpenses = prevExpenses.filter(expense => expense.ticketId !== selectedTicket.id);
            const formattedExpenses = result.expenses.map(expense => ({
              id: expense.id,
              ticketId: expense.ticketId || selectedTicket.id,
              clientId: expense.clientId || selectedTicket.clientId,
              description: expense.description || '',
              amount: expense.amount || 0,
              date: (expense as any).date || (expense as any).createdAt || new Date(),
              category: expense.category,
              billable: expense.billable || false,
              billed: expense.billed || false,
              receiptUrl: expense.receiptUrl || null,
              deletedAt: expense.deletedAt || null,
              userId: (expense as any).userId || undefined
            }));
            return [...formattedExpenses, ...filteredOldExpenses];
          });
        }
      } catch (error) {
        console.error('Error fetching ticket details:', error);
        toast.error('Failed to load ticket details');
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
          <>
            {/* Add backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10"
              onClick={() => setSelectedTicket(null)} // Close detail pane when backdrop is clicked
            />
            
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-[55%] bg-gray-100 dark:bg-zinc-900/90 dark:backdrop-blur-md border-l dark:border-border/40 shadow-lg overflow-auto"
              style={{ zIndex: 20 }} // Higher z-index than the backdrop
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
              <div className="p-6">
                <TicketDetailPane 
                  ticket={selectedTicket}
                  comments={comments.filter(c => c.ticketId === selectedTicket.id)}
                  timeEntries={timeEntries.filter(t => t.ticketId === selectedTicket.id)}
                  expenses={expenses.filter(e => e.ticketId === selectedTicket.id)}
                  statusHistory={statusHistory.filter(s => s.ticketId === selectedTicket.id)}
                  onLogTime={handleLogTime}
                  onAddExpense={handleAddExpense}
                  onUpdateTicket={handleUpdateTicket}
                  onDeleteTimeEntry={handleDeleteTimeEntry}
                  clients={clients}
                  teamMembers={teamMembers}
                  onCommentAdded={handleAddComment}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}