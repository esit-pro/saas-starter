'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, SaveIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getClientById, updateClient } from '../../actions';
import { Client } from '@/lib/db/schema';

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Load client data
  useEffect(() => {
    const fetchClient = async () => {
      setIsLoading(true);
      try {
        const clientId = parseInt(params.id);
        if (isNaN(clientId)) {
          toast.error('Invalid client ID');
          router.push('/dashboard/clients');
          return;
        }

        const result = await getClientById(clientId, new FormData());
        if (result.error) {
          toast.error(result.error);
          router.push('/dashboard/clients');
          return;
        }

        if (result.client) {
          setClient(result.client);
          // Initialize form with client data
          setName(result.client.name);
          setContactName(result.client.contactName || '');
          setEmail(result.client.email || '');
          setPhone(result.client.phone || '');
          setAddress(result.client.address || '');
          setNotes(result.client.notes || '');
          setIsActive(result.client.isActive);
        }
      } catch (error) {
        console.error('Error fetching client:', error);
        toast.error('Failed to load client data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [params.id, router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client) return;
    
    setIsSaving(true);
    try {
      if (!name.trim() || !contactName.trim() || !email.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const clientData = {
        id: client.id,
        name,
        contactName,
        email,
        phone,
        address,
        notes,
        isActive
      };
      
      const result = await updateClient(clientData, new FormData());
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      if (result.success) {
        toast.success(result.success);
        router.push('/dashboard/clients');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500 dark:text-muted-foreground">Loading client data...</span>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Edit Client</h1>
        </div>
      </div>
      
      <Card className="shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Business St, Suite 101, City, State, ZIP"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2 md:col-span-2">
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
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={isSaving || !name.trim() || !contactName.trim() || !email.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}