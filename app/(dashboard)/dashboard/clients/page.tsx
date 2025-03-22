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
  Loader2,
  ClipboardList,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '../../components/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { getClientsForTeam, createClient, updateClient, deleteClient } from './actions';
import { Client } from '@/lib/db/schema';

// Create Client Form component
function CreateClientForm({ onCreateClient }: { onCreateClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'teamId'>) => void }) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!name.trim() || !contactName.trim() || !email.trim()) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      onCreateClient({
        name,
        contactName,
        email,
        phone,
        address,
        notes,
        isActive,
        deletedAt: null,
        createdBy: null,
        updatedBy: null,
        deletedBy: null
      });
      
      // Reset form
      setName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
      setIsActive(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Company Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corporation"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="contactName">Contact Person <span className="text-red-500">*</span></Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
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
          
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Business St, Suite 101, City, State, ZIP"
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about this client..."
              rows={3}
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
          
          <Button 
            type="submit" 
            className="w-full" 
            variant="form" 
            disabled={isSubmitting || !name.trim() || !contactName.trim() || !email.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Client'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ClientDetailPane({ 
  client, 
  onUpdateClient,
  initialEditMode = false
}: { 
  client: Client | null;
  onUpdateClient: (id: number, data: Partial<Client>) => Promise<void>;
  initialEditMode?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [editedData, setEditedData] = useState<Partial<Client>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'invoices'>('details');
  
  useEffect(() => {
    // Reset state when client changes
    setIsEditing(false);
    setEditedData({});
    setIsSaving(false);
  }, [client?.id]);
  
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
  
  const handleChange = (field: keyof Client, value: any) => {
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
      await onUpdateClient(client.id, editedData);
      setIsEditing(false);
      setEditedData({});
      toast.success('Client updated successfully');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Failed to update client');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Merge client data with edited data
  const displayData = {
    ...client,
    ...editedData
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 flex flex-col gap-8">
        {/* Client header with edit button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-primary/5 flex items-center justify-center text-gray-500 dark:text-primary mr-6">
              <Users className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between max-w-xl">
                {isEditing ? (
                  <div className="flex flex-col gap-3 w-full max-w-xl">
                    <Input
                      value={displayData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="text-2xl font-bold h-auto py-2 px-3 bg-primary/5 dark:bg-primary/5 border-primary/30 dark:border-primary/30"
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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">{displayData.name}</h2>
                )}
                
                <div className="flex items-center">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span>Status:</span>
                      <Switch 
                        checked={displayData.isActive}
                        onCheckedChange={(checked) => handleChange('isActive', checked)}
                      />
                    </div>
                  ) : (
                    displayData.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        Inactive
                      </span>
                    )
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
                  <span>Client #{client.id}</span>
                </div>
                <div className="flex items-center">
                  <span>Created {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client details cards */}
        {activeTab === 'details' && (
          <>
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6`}>
              <div className={`border dark:border-border rounded-lg p-5`}>
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3 flex items-center">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 dark:text-muted-foreground mb-1">Email</div>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={displayData.email || ''}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className="h-8 bg-primary/5 dark:bg-primary/5 border-primary/30 dark:border-primary/30"
                        />
                      ) : (
                        <div className="font-medium text-gray-900 dark:text-foreground">
                          <a href={`mailto:${displayData.email}`} className="text-blue-600 dark:text-blue-500 hover:underline">
                            {displayData.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`border dark:border-border rounded-lg p-5`}>
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">Contact Person</h3>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                  <div className="flex-1">
                    {isEditing ? (
                      <Input
                        value={displayData.contactName || ''}
                        onChange={(e) => handleChange('contactName', e.target.value)}
                        className="h-8 bg-primary/5 dark:bg-primary/5 border-primary/30 dark:border-primary/30 mt-1"
                      />
                    ) : (
                      <span className="font-medium text-gray-900 dark:text-foreground">
                        {displayData.contactName || "No contact person"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`border dark:border-border rounded-lg p-5`}>
                <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">Phone</h3>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                  <div className="flex-1">
                    {isEditing ? (
                      <Input
                        value={displayData.phone || ''}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        className="h-8 bg-primary/5 dark:bg-primary/5 border-primary/30 dark:border-primary/30 mt-1"
                      />
                    ) : (
                      <span className="font-medium text-gray-900 dark:text-foreground">
                        {displayData.phone || "No phone number"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className={`border dark:border-border rounded-lg p-5`}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3 flex items-center">
                Address
              </h3>
              {isEditing ? (
                <Textarea
                  value={displayData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Enter the client's address"
                  className="min-h-[80px] bg-primary/5 dark:bg-primary/5 border-primary/30 dark:border-primary/30 mt-2"
                />
              ) : (
                <div className="text-gray-900 dark:text-foreground whitespace-pre-wrap">
                  {displayData.address || 'No address provided.'}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className={`border dark:border-border rounded-lg p-5`}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3 flex items-center">
                Notes
              </h3>
              {isEditing ? (
                <Textarea
                  value={displayData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Enter notes about this client"
                  className="min-h-[120px] bg-primary/5 dark:bg-primary/5 border-primary/30 dark:border-primary/30 mt-2"
                />
              ) : (
                <div className="text-gray-900 dark:text-foreground whitespace-pre-wrap">
                  {displayData.notes || 'No notes provided.'}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab navigation */}
        <div className="border-b dark:border-border">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-primary text-primary dark:text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-2 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-primary text-primary dark:text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-2 border-b-2 font-medium text-sm ${
                activeTab === 'invoices'
                  ? 'border-primary text-primary dark:text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Invoices
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="min-h-[400px]">
          {activeTab === 'activity' && (
            <div className="flex items-center justify-center h-64 border rounded-lg dark:border-border">
              <div className="text-center">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-500 dark:text-muted-foreground">No activity recorded</h3>
                <p className="mt-2 text-gray-500 dark:text-muted-foreground">Client activity will appear here</p>
              </div>
            </div>
          )}
          
          {activeTab === 'invoices' && (
            <div className="flex items-center justify-center h-64 border rounded-lg dark:border-border">
              <div className="text-center">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-500 dark:text-muted-foreground">No invoices found</h3>
                <p className="mt-2 text-gray-500 dark:text-muted-foreground">Client invoices will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialEditMode, setInitialEditMode] = useState(false);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const result = await getClientsForTeam(new FormData());
      if (result.error) {
        toast.error(result.error);
        setClients([]);
      } else if (result.clients) {
        setClients(result.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);
  
  // Handler for adding a new client
  const handleCreateClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'teamId'>) => {
    try {
      console.log('Creating client with data:', clientData);
      
      const formData = new FormData();
      Object.entries(clientData).forEach(([key, value]) => {
        formData.append(key, value?.toString() || '');
      });
      
      // Close the dialog immediately to improve UX
      setIsDialogOpen(false);
      
      const result = await createClient({
        ...clientData,
        createdBy: null, // Will be set by the server
        updatedBy: null, // Will be set by the server
        deletedBy: null
      }, formData);
      console.log('Server response:', result);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.success) {
        toast.success(result.success);
        // Always fetch clients again after a create attempt, even if there was an error
        // This ensures we display current data from the database
        fetchClients();
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    }
  };
  
  // Handler for deleting a client
  const handleDeleteClient = async (id: number) => {
    try {
      // Validate the ID is a valid number
      if (typeof id !== 'number' || isNaN(id) || id <= 0) {
        console.error('Invalid client ID for deletion:', id);
        toast.error('Error deleting client: Invalid ID');
        return Promise.reject('Invalid client ID');
      }
      
      const result = await deleteClient({ id }, new FormData());
      
      if (result.error) {
        toast.error(result.error);
        return Promise.reject(result.error);
      }
      
      if (result.success) {
        toast.success(result.success);
        // If the deleted client was selected, clear the selection
        if (selectedClientId === id) {
          setSelectedClientId(null);
        }
        // Refetch clients to get the updated list
        await fetchClients();
        return Promise.resolve();
      }
      
      return Promise.reject("Unknown error");
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
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
          <span className="dark:text-foreground">{row.original.phone || 'Not provided'}</span>
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
          {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row, table }: any) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                data-action="menu"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem
                className="cursor-pointer flex items-center"
                onClick={() => {
                  // Select the client and open in edit mode
                  setSelectedClientId(row.original.id);
                  setInitialEditMode(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
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
            setInitialEditMode(false);
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          <span>View details</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer flex items-center"
          onClick={() => {
            // Select the client and open in edit mode
            setSelectedClientId(row.original.id);
            setInitialEditMode(true);
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          <span>Edit</span>
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
      isLoading={isLoading}
    />
  );

  // Handler for updating a client
  const handleUpdateClient = async (id: number, data: Partial<Client>) => {
    try {
      // Create form data for API call
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value?.toString() || '');
      });
      
      // Update client in the database
      const result = await updateClient({ id, ...data }, formData);
      
      if (result.error) {
        toast.error(result.error);
        return Promise.reject(result.error);
      }
      
      if (result.success) {
        // Update local state to avoid refetching
        setClients(clients.map(client => 
          client.id === id ? { ...client, ...data } : client
        ));
        
        return Promise.resolve();
      }
      
      return Promise.reject("Unknown error");
    } catch (error) {
      console.error('Error updating client:', error);
      return Promise.reject(error);
    }
  };

  // Setup the main view
  const tableView = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Clients</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              onCreateClient={handleCreateClient}
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
          <>
            {/* Add backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10"
              onClick={() => setSelectedClientId(null)} // Close detail pane when backdrop is clicked
            />
            
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-2/5 bg-gray-100 dark:bg-zinc-900/90 dark:backdrop-blur-md border-l dark:border-border/40 shadow-lg overflow-auto"
              style={{ zIndex: 20 }} // Higher z-index than the backdrop
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
                <ClientDetailPane 
                  client={selectedClient} 
                  onUpdateClient={handleUpdateClient}
                  initialEditMode={initialEditMode}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}