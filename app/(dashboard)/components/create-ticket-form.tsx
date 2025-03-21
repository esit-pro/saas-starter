'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClientCombobox } from './client-combobox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createTicket, getClientsForSelection } from '@/app/(dashboard)/dashboard/tickets/actions';

type Client = {
  id: number;
  name: string;
};

type CreateTicketFormProps = {
  clients: Client[];
  onCreateTicket: (ticket: {
    title: string;
    description: string;
    clientId: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
  }) => void;
};

export function CreateTicketForm({ clients, onCreateTicket }: CreateTicketFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !selectedClientId) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('clientId', selectedClientId.toString());
      formData.append('priority', priority);
      formData.append('category', category);
      
      // Submit to server
      const result = await createTicket(
        {
          title,
          description,
          clientId: selectedClientId,
          priority,
          category
        },
        formData
      );
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.success) {
        toast.success(result.success);
        
        // Call the parent handler if provided
        onCreateTicket({
          title,
          description,
          clientId: selectedClientId,
          priority,
          category
        });
        
        // Reset form
        setTitle('');
        setDescription('');
        setSelectedClientId(null);
        setPriority('medium');
        setCategory('');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="client">Client <span className="text-red-500">*</span></Label>
            <ClientCombobox
              clients={clients}
              selectedClientId={selectedClientId}
              onClientChange={setSelectedClientId}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="title">Ticket Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the issue"
              className="w-full min-h-[100px] px-3 py-2 bg-white dark:bg-zinc-800 text-sm rounded-md border border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground resize-none"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full h-9 rounded-md border border-input bg-white dark:bg-zinc-800 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isSubmitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Hardware, Software, Network"
              disabled={isSubmitting}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            variant="form" 
            disabled={isSubmitting || !selectedClientId || !title.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Ticket'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 