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
  'open': 'bg-blue-50 text-blue-700',
  'in-progress': 'bg-amber-50 text-amber-700',
  'on-hold': 'bg-purple-50 text-purple-700',
  'completed': 'bg-green-50 text-green-700',
  'closed': 'bg-gray-50 text-gray-700',
};

const priorityIcons: Record<string, React.ReactNode> = {
  'low': <CheckCircle className="h-4 w-4 text-green-500" />,
  'medium': <Clock className="h-4 w-4 text-amber-500" />,
  'high': <AlertCircle className="h-4 w-4 text-red-500" />,
  'critical': <AlertTriangle className="h-4 w-4 text-red-700" />,
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [activeTickets, setActiveTickets] = useState<ServiceTicket[]>([]);
  const [completedTickets, setCompletedTickets] = useState<ServiceTicket[]>([]);
  const [selectedTab, setSelectedTab] = useState('active');
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [comments, setComments] = useState<Comment[]>(demoComments);
  const [clients, setClients] = useState<Client[]>(demoClients);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
    setShowCreateForm(false);
    setSelectedTicket(newTicket);
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
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-3">
            <Ticket className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.original.title}</div>
            <div className="text-sm text-gray-500">
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
        <div className="text-gray-500">
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
              <DropdownMenuItem onClick={() => setSelectedTicket(row.original)} className="cursor-pointer flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                <span>View details</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/tickets/${row.original.id}/edit`} className="cursor-pointer flex items-center">
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </Link>
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

  // Widgets to display - either create ticket form or ticket details with comments/time logging
  const widgetsContent = showCreateForm ? (
    <TicketWidgetsCard
      leftTitle="Create Ticket"
      leftWidget={
        <CreateTicketForm
          clients={clients}
          onCreateTicket={handleCreateTicket}
        />
      }
      rightTitle="Recent Activity"
      rightWidget={
        <div className="text-gray-500 text-center py-8">
          Select a ticket to view details and activity
        </div>
      }
    />
  ) : selectedTicket ? (
    <TicketWidgetsCard
      leftTitle="Comments & Activity"
      leftWidget={
        <TicketComments
          ticketId={selectedTicket.id}
          comments={comments}
          onAddComment={handleAddComment}
        />
      }
      rightTitle="Log Time"
      rightWidget={
        <TimeEntryForm
          ticketId={selectedTicket.id}
          clientId={selectedTicket.clientId}
          onLogTime={handleLogTime}
        />
      }
    />
  ) : (
    <TicketWidgetsCard
      leftTitle="Ticket Details"
      leftWidget={
        <div className="text-gray-500 text-center py-8">
          Select a ticket to view details
        </div>
      }
      rightTitle="Log Time"
      rightWidget={
        <div className="text-gray-500 text-center py-8">
          Select a ticket to log time
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Service Tickets</h1>
        <Button onClick={() => {
          setShowCreateForm(true);
          setSelectedTicket(null);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>
      
      {/* Widgets area */}
      {widgetsContent}
      
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
    </div>
  );
}