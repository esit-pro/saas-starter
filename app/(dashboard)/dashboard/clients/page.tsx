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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    // In a real app, you'd fetch data from an API
    // For this demo, we'll use the demo data
    setClients(demoClients);
  }, []);

  const columns = [
    {
      accessorKey: 'name',
      header: 'Client Name',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-3">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.original.name}</div>
            <div className="text-sm text-gray-500">
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
          <Mail className="h-4 w-4 text-gray-400 mr-2" />
          <a href={`mailto:${row.original.email}`} className="text-blue-600 hover:underline">
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
          <Phone className="h-4 w-4 text-gray-400 mr-2" />
          <span>{row.original.phone}</span>
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
              <span className="text-green-700">Active</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700">Inactive</span>
            </>
          )}
        </div>
      ),
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
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
      </div>
      
      <DataTable
        columns={columns}
        data={clients}
        title="Client List"
        createRoute="/dashboard/clients/new"
        searchPlaceholder="Search clients..."
        filterColumn="name"
      />
    </div>
  );
}