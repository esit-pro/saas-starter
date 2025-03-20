'use client';

import { useEffect, useState } from 'react';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye,
  Users,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Plus,
  Calendar as CalendarIcon,
  File as FileIcon,
  X,
} from 'lucide-react';
import { SplitView } from '../../components/split-view';
import { Button } from '@/components/ui/button';
import { DataTable } from '../../components/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { motion, AnimatePresence } from 'framer-motion';

// Client type definition
type Client = {
  id: number;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
};

// Demo data
const demoClients: Client[] = [
  {
    id: 1,
    name: 'Acme Corporation',
    contactName: 'John Doe',
    email: 'john@acme.com',
    phone: '(555) 123-4567',
    isActive: true,
    createdAt: new Date(2023, 1, 15),
  },
  {
    id: 2,
    name: 'Globex Inc',
    contactName: 'Jane Smith',
    email: 'jane@globex.com',
    phone: '(555) 987-6543',
    isActive: true,
    createdAt: new Date(2023, 3, 22),
  },
  {
    id: 3,
    name: 'Wayne Enterprises',
    contactName: 'Bruce Wayne',
    email: 'bruce@wayne.com',
    phone: '(555) 333-7777',
    isActive: true,
    createdAt: new Date(2023, 5, 10),
  },
  {
    id: 4,
    name: 'Stark Industries',
    contactName: 'Tony Stark',
    email: 'tony@stark.com',
    phone: '(555) 444-8888',
    isActive: true,
    createdAt: new Date(2023, 6, 5),
  },
  {
    id: 5,
    name: 'Oscorp',
    contactName: 'Norman Osborn',
    email: 'norman@oscorp.com',
    phone: '(555) 555-9999',
    isActive: false,
    createdAt: new Date(2023, 2, 18),
  },
  {
    id: 6,
    name: 'Umbrella Corporation',
    contactName: 'Albert Wesker',
    email: 'albert@umbrella.com',
    phone: '(555) 666-1111',
    isActive: false,
    createdAt: new Date(2023, 4, 30),
  },
  {
    id: 7,
    name: 'Cyberdyne Systems',
    contactName: 'Miles Dyson',
    email: 'miles@cyberdyne.com',
    phone: '(555) 777-2222',
    isActive: true,
    createdAt: new Date(2023, 7, 12),
  },
  {
    id: 8,
    name: 'LexCorp',
    contactName: 'Lex Luthor',
    email: 'lex@lexcorp.com',
    phone: '(555) 888-3333',
    isActive: true,
    createdAt: new Date(2023, 8, 25),
  },
  {
    id: 9,
    name: 'Weyland-Yutani Corp',
    contactName: 'Ellen Ripley',
    email: 'ripley@weylandyutani.com',
    phone: '(555) 999-4444',
    isActive: true,
    createdAt: new Date(2023, 9, 17),
  },
  {
    id: 10,
    name: 'Tyrell Corporation',
    contactName: 'Eldon Tyrell',
    email: 'eldon@tyrell.com',
    phone: '(555) 000-5555',
    isActive: false,
    createdAt: new Date(2023, 10, 8),
  },
  {
    id: 11,
    name: 'Aperture Science',
    contactName: 'Cave Johnson',
    email: 'cave@aperture.com',
    phone: '(555) 111-6666',
    isActive: true,
    createdAt: new Date(2023, 11, 3),
  },
  {
    id: 12,
    name: 'Black Mesa',
    contactName: 'Gordon Freeman',
    email: 'gordon@blackmesa.com',
    phone: '(555) 222-7777',
    isActive: true,
    createdAt: new Date(2024, 0, 20),
  },
];

// Create Client Form component
function CreateClientForm({ onCreateClient }: { onCreateClient: (client: Omit<Client, 'id' | 'createdAt'>) => void }) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !contactName.trim() || !email.trim()) return;
    
    onCreateClient({
      name,
      contactName,
      email,
      phone,
      isActive
    });
    
    // Reset form
    setName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setIsActive(true);
  };

  return (
    <div className="py-6">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corporation"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="contactName">Contact Person</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@example.com"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="isActive" 
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive" className="font-normal">Active Client</Label>
          </div>
          
          <Button type="submit" className="w-full" disabled={!name.trim() || !contactName.trim() || !email.trim()}>
            Create Client
          </Button>
        </div>
      </form>
    </div>
  );
}

function ClientDetailPane({ client }: { client: Client | null }) {
  if (!client) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Select a client to view details</h3>
          <p className="mt-2">Click on a client from the list to view their detailed information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 flex flex-col gap-6">
        {/* Client header */}
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-primary/5 flex items-center justify-center text-gray-500 dark:text-primary mr-4">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">{client.name}</h2>
            <div className="text-sm text-gray-500 dark:text-muted-foreground flex items-center gap-4 mt-1">
              <div className="flex items-center">
                <span>Client #{client.id}</span>
              </div>
              <div className="flex items-center">
                {client.isActive ? (
                  <span className="flex items-center text-green-700 dark:text-green-500">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center text-red-700 dark:text-red-500">
                    <XCircle className="h-4 w-4 mr-1" />
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <span>Created {formatDistanceToNow(client.createdAt, { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border dark:border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8">
                  <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">Email</div>
                  <div className="font-medium text-gray-900 dark:text-foreground">
                    <a href={`mailto:${client.email}`} className="text-blue-600 dark:text-blue-500 hover:underline">
                      {client.email}
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8">
                  <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">Phone</div>
                  <div className="font-medium text-gray-900 dark:text-foreground">{client.phone}</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8">
                  <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">Contact Person</div>
                  <div className="font-medium text-gray-900 dark:text-foreground">{client.contactName}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border dark:border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">Account Details</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8">
                  <CheckCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">Status</div>
                  <div className="font-medium text-gray-900 dark:text-foreground">
                    {client.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8">
                  <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">Client Since</div>
                  <div className="font-medium text-gray-900 dark:text-foreground">
                    {client.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8">
                  <FileIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">Contracts</div>
                  <div className="font-medium text-gray-900 dark:text-foreground">
                    3 Active Contracts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="border dark:border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">Recent Activity</h3>
          
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="relative pl-6 pb-6 border-l dark:border-border">
                <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500"></div>
                <div className="text-sm text-gray-500 dark:text-muted-foreground">
                  {formatDistanceToNow(
                    new Date(client.createdAt.getTime() - i * 86400000 * (i+1)),
                    { addSuffix: true }
                  )}
                </div>
                <div className="font-medium text-gray-900 dark:text-foreground mt-1">
                  {i === 0 && "Invoice #INV-2023-005 sent"}
                  {i === 1 && "Payment received for #INV-2023-004"}
                  {i === 2 && "Support ticket #ST-2023-021 closed"}
                  {i === 3 && "Meeting scheduled with sales team"}
                  {i === 4 && "Client onboarding completed"}
                </div>
                <div className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                  {i === 0 && "Invoice for $2,500.00 was sent via email"}
                  {i === 1 && "Payment of $1,750.00 received via bank transfer"}
                  {i === 2 && "Issue with login access was resolved"}
                  {i === 3 && "Scheduled for next Tuesday at 10:00 AM"}
                  {i === 4 && "All setup procedures have been completed"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Services */}
        <div className="border dark:border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-4">
            Upcoming Services
          </h3>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => {
              const futureDate = new Date();
              futureDate.setDate(futureDate.getDate() + (i+1) * 5);
              
              return (
                <div key={i} className="flex items-start border-b dark:border-border pb-4 last:border-0 last:pb-0">
                  <div className="w-12 h-12 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-foreground">
                      {i === 0 && "Quarterly System Review"}
                      {i === 1 && "Software Upgrade"}
                      {i === 2 && "Annual Strategy Meeting"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                      {futureDate.toLocaleDateString()} at {
                        i === 0 ? "10:00 AM" : i === 1 ? "2:30 PM" : "9:00 AM"
                      }
                    </div>
                    <div className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                      {i === 0 && "Review existing systems and discuss potential improvements"}
                      {i === 1 && "Deploy latest software version across all locations"}
                      {i === 2 && "Annual planning session with executive team"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch data from an API
    // For this demo, we'll use the demo data
    setClients(demoClients);
  }, []);
  
  // Handler for adding a new client
  const handleCreateClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    // In a real app, you'd call an API to create the client
    // For this demo, we'll just add it to the state
    const newClient: Client = {
      id: clients.length + 1,
      ...clientData,
      createdAt: new Date(),
    };

    setClients([newClient, ...clients]);
    setShowCreateForm(false);
  };
  
  // Handler for deleting a client
  const handleDeleteClient = async (id: number) => {
    // In a real app, you'd call an API to delete the client
    // For this demo, we'll just remove it from the state
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setClients(clients.filter(client => client.id !== id));
      return Promise.resolve();
    } catch (error) {
      console.error('Error deleting client:', error);
      return Promise.reject(error);
    }
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Client Name',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-primary/5 flex items-center justify-center text-gray-500 dark:text-primary mr-3 flex-shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-foreground">{row.original.name}</div>
            <div className="text-sm text-gray-500 dark:text-muted-foreground">
              Client #{row.original.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'contactName',
      header: 'Contact',
      cell: ({ row }: any) => (
        <div>{row.original.contactName}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
          <a href={`mailto:${row.original.email}`} className="text-blue-600 dark:text-blue-500 hover:underline">
            {row.original.email}
          </a>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
          <span className="dark:text-foreground">{row.original.phone}</span>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          {row.original.isActive ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-green-700 dark:text-green-500">Active</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 dark:text-red-500">Inactive</span>
            </>
          )}
        </div>
      ),
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
                className="cursor-pointer flex items-center"
                onClick={() => {
                  const clientId = row.original.id;
                  // Toggle selection - if already selected, deselect; otherwise select
                  setSelectedClientId(prev => prev === clientId ? null : clientId);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>View details</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/clients/${row.original.id}/edit`} className="cursor-pointer flex items-center">
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </Link>
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

  // Find selected client
  const selectedClient = clients.find(client => client.id === selectedClientId) || null;

  // Update click handler for row actions
  const handleRowClick = (client: Client) => {
    setSelectedClientId(client.id);
  };

  // Update the "View details" action to handle clicking
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
            const clientId = row.original.id;
            // Toggle selection - if already selected, deselect; otherwise select
            setSelectedClientId(prev => prev === clientId ? null : clientId);
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          <span>View details</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/clients/${row.original.id}/edit`} className="cursor-pointer flex items-center">
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-700 flex items-center cursor-pointer"
          onClick={() => {
            if (handleDeleteClient) {
              handleDeleteClient(row.original.id);
              if (selectedClientId === row.original.id) {
                setSelectedClientId(null);
              }
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </>
    );
  };

  // Create a DataTable with context menu - make sure we handle the row data properly
  const clientsTable = (
    <DataTable
      columns={columns}
      data={clients}
      title="Client List"
      searchPlaceholder="Search clients..."
      filterColumn="name"
      onDelete={handleDeleteClient}
      contextMenuItems={contextMenuItems}
      onRowClick={handleRowClick}
    />
  );

  // Setup the main view
  const tableView = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Clients</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Client
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
              <DialogTitle className="text-gray-900 dark:text-gray-100">Create New Client</DialogTitle>
              <DialogDescription className="text-gray-700 dark:text-gray-300">
                Fill in the details below to create a new client.
              </DialogDescription>
            </DialogHeader>
            <CreateClientForm 
              onCreateClient={(data) => {
                handleCreateClient(data);
                // Close dialog after submit
                document.querySelector('[aria-label="Close"]')?.dispatchEvent(
                  new MouseEvent("click", { bubbles: true })
                );
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {clientsTable}
    </div>
  );

  // Conditionally render split view or just the table based on selection
  return (
    <div className="relative">
      {tableView}
      <AnimatePresence>
        {selectedClientId && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-2/5 bg-gray-100 dark:bg-zinc-900/90 dark:backdrop-blur-md border-l dark:border-border/40 shadow-lg overflow-auto"
            style={{ zIndex: 10 }}
          >
            <div className="flex justify-between items-center p-4 border-b dark:border-border">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">Client Details</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedClientId(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="p-4">
              <ClientDetailPane client={selectedClient} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}