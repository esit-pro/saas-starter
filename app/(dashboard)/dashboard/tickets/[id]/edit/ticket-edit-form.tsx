'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ClientCombobox } from '@/app/(dashboard)/components/client-combobox';
import { Loader2, SaveIcon, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  getTicketById, 
  updateTicket, 
  getClientsForSelection,
  getTeamMembersForAssignment 
} from '../../actions';
import { ServiceTicket } from '@/lib/db/schema';

interface TicketEditFormProps {
  ticketId: number;
}

export function TicketEditForm({ ticketId }: TicketEditFormProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<ServiceTicket | null>(null);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: number; name: string | null; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState<number | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [status, setStatus] = useState<'open' | 'in-progress' | 'on-hold' | 'completed' | 'closed'>('open');
  const [category, setCategory] = useState('');
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');

  // Load ticket data and related options
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isNaN(ticketId) || ticketId <= 0) {
          toast.error('Invalid ticket ID');
          router.push('/dashboard/tickets');
          return;
        }

        // Get ticket data
        const ticketResult = await getTicketById(ticketId);
        if (ticketResult.error || !ticketResult.ticket) {
          toast.error(ticketResult.error || 'Ticket not found');
          router.push('/dashboard/tickets');
          return;
        }

        // Get clients for dropdown
        const clientsResult = await getClientsForSelection();
        if (clientsResult.error) {
          toast.error('Failed to load clients');
        } else {
          setClients(clientsResult.clients || []);
        }

        // Get team members for assignment dropdown
        const teamMembersResult = await getTeamMembersForAssignment();
        if (teamMembersResult.error) {
          toast.error('Failed to load team members');
        } else {
          setTeamMembers(teamMembersResult.members || []);
        }

        // Set form data from ticket
        const ticketData = ticketResult.ticket;
        setTicket(ticketData);
        setTitle(ticketData.title);
        setDescription(ticketData.description || '');
        setClientId(ticketData.clientId);
        setPriority(ticketData.priority as 'low' | 'medium' | 'high' | 'critical');
        setStatus(ticketData.status as 'open' | 'in-progress' | 'on-hold' | 'completed' | 'closed');
        setCategory(ticketData.category || '');
        setAssignedTo(ticketData.assignedTo || null);
        
        // Format due date if present
        if (ticketData.dueDate) {
          const dueDateObj = new Date(ticketData.dueDate);
          setDueDate(format(dueDateObj, 'yyyy-MM-dd'));
        }
      } catch (error) {
        console.error('Error fetching ticket data:', error);
        toast.error('Failed to load ticket data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ticketId, router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticket || !clientId) return;
    
    setIsSaving(true);
    try {
      if (!title.trim()) {
        toast.error('Please enter a title');
        return;
      }
      
      const ticketData = {
        id: ticket.id,
        title,
        description,
        clientId,
        priority,
        status,
        category,
        assignedTo,
        dueDate: dueDate || null
      };
      
      const formData = new FormData();
      Object.entries(ticketData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      const result = await updateTicket(ticketData, formData);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.success) {
        toast.success(result.success);
        router.push('/dashboard/tickets');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500 dark:text-muted-foreground">Loading ticket data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Edit Ticket</h1>
        </div>
      </div>
      
      <Card className="shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Ticket Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="client">Client <span className="text-red-500">*</span></Label>
                <ClientCombobox
                  clients={clients}
                  selectedClientId={clientId}
                  onClientChange={setClientId}
                  disabled={isSaving}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-white dark:bg-zinc-800 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-white dark:bg-zinc-800 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <select
                  id="assignedTo"
                  value={assignedTo || ''}
                  onChange={(e) => setAssignedTo(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full h-9 rounded-md border border-input bg-white dark:bg-zinc-800 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">-- Unassigned --</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Hardware, Software, Network"
                />
              </div>
              
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the issue"
                  rows={5}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
              className="h-9"
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              variant="primary"
              disabled={isSaving || !title.trim() || !clientId}
              className="h-9"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}