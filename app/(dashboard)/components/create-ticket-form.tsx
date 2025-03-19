'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClientCombobox } from './client-combobox';
import { Card } from '@/components/ui/card';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !selectedClientId) return;
    
    onCreateTicket({
      title,
      description,
      clientId: selectedClientId,
      priority,
      category,
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setSelectedClientId(null);
    setPriority('medium');
    setCategory('');
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="client">Client</Label>
          <ClientCombobox
            clients={clients}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
          />
        </div>
        
        <div>
          <Label htmlFor="title">Ticket Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className="w-full"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the issue"
            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Hardware, Software, Network"
            className="w-full"
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={!selectedClientId || !title.trim()}>
          Create Ticket
        </Button>
      </form>
    </Card>
  );
} 