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
} from 'lucide-react';
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
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

  const columns = [
    {
      accessorKey: 'name',
      header: 'Client Name',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-primary/5 flex items-center justify-center text-gray-500 dark:text-primary mr-3">
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
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/clients/${row.original.id}`} className="cursor-pointer flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View details</span>
                </Link>
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
                onClick={() => alert(`Delete ${row.original.name}`)}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Clients</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Client
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
      
      <DataTable
        columns={columns}
        data={clients}
        title="Client List"
        searchPlaceholder="Search clients..."
        filterColumn="name"
      />
    </div>
  );
}