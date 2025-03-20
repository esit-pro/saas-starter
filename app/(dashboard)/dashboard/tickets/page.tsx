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
  MessageSquare
} from 'lucide-react';
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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [activeTickets, setActiveTickets] = useState<ServiceTicket[]>([]);
  const [completedTickets, setCompletedTickets] = useState<ServiceTicket[]>([]);
  const [selectedTab, setSelectedTab] = useState('active');
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [comments, setComments] = useState<Comment[]>(demoComments);
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
      cell: ({ row }: any) => (
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
                onClick={() => setSelectedTicket(row.original)} 
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
                  setSelectedTicket(row.original);
                  // The dialog will show the time entry form
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
                }}
                className="cursor-pointer flex items-center"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Complete</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 flex items-center cursor-pointer"
                onClick={() => alert(`Delete ticket #${row.original.id}`)}
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


  return (
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
          />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <DataTable
            columns={columns}
            data={completedTickets}
            title="Completed Tickets"
            searchPlaceholder="Search completed tickets..."
            filterColumn="title"
          />
        </TabsContent>
      </Tabs>
      
      {/* Details Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}>
          <DialogContent 
            className="sm:max-w-[900px] bg-white dark:bg-background text-card-foreground dark:text-card-foreground shadow-md
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:slide-in-from-top-2 data-[state=open]:slide-in-from-right-2
            data-[state=closed]:slide-out-to-top-2 data-[state=closed]:slide-out-to-right-2
            border border-border dark:border-border/20 rounded-lg"
          >
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Ticket Details</DialogTitle>
              <DialogDescription className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">{selectedTicket.title}</span>
                <span className="text-sm ml-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[selectedTicket.status]}`}>
                    {selectedTicket.status}
                  </span>
                </span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium flex items-center text-gray-800 dark:text-gray-200 mb-4">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments & Activity
                </h3>
                <TicketComments
                  ticketId={selectedTicket.id}
                  comments={comments}
                  onAddComment={handleAddComment}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium flex items-center text-gray-800 dark:text-gray-200 mb-4">
                  <Clock className="h-4 w-4 mr-2" />
                  Log Time
                </h3>
                <TimeEntryForm
                  ticketId={selectedTicket.id}
                  clientId={selectedTicket.clientId}
                  onLogTime={handleLogTime}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}