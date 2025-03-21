'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logTimeEntry } from '@/app/(dashboard)/dashboard/tickets/actions';

type TimeEntryFormProps = {
  ticketId: number;
  clientId: number;
  onLogTime: (timeEntry: {
    ticketId: number;
    clientId: number;
    description: string;
    startTime: Date;
    duration: number;
    billable: boolean;
    billed: boolean;
  }) => void;
};

export function TimeEntryForm({ ticketId, clientId, onLogTime }: TimeEntryFormProps) {
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [billable, setBillable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || (!hours && !minutes)) {
      toast.error('Please enter a description and duration');
      return;
    }
    
    const hoursNum = hours ? parseInt(hours, 10) : 0;
    const minutesNum = minutes ? parseInt(minutes, 10) : 0;
    const totalMinutes = hoursNum * 60 + minutesNum;
    
    if (totalMinutes <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Current date and time for startTime
      const now = new Date();
      const startDateTime = now.toISOString();
      
      // Create form data
      const formData = new FormData();
      formData.append('ticketId', ticketId.toString());
      formData.append('clientId', clientId.toString());
      formData.append('description', description);
      formData.append('duration', totalMinutes.toString());
      formData.append('startTime', startDateTime);
      formData.append('billable', billable.toString());
      
      // Submit to server
      const result = await logTimeEntry(
        {
          ticketId,
          clientId,
          description,
          duration: totalMinutes,
          startTime: startDateTime,
          billable,
          billed: false
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
        if (onLogTime) {
          onLogTime({
            ticketId,
            clientId,
            description,
            startTime: now,
            duration: totalMinutes,
            billable,
            billed: false
          });
        }
        
        // Reset form
        setDescription('');
        setHours('');
        setMinutes('');
        setBillable(true);
      }
    } catch (error) {
      console.error('Error logging time:', error);
      toast.error('Failed to log time');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form id="time-entry-form" onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="grid gap-6 flex-1">
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What work did you perform?"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="minutes">Minutes</Label>
            <Input
              id="minutes"
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label>Billing Type</Label>
          <RadioGroup 
            defaultValue="billable" 
            value={billable ? "billable" : "non-billable"} 
            onValueChange={(val) => setBillable(val === "billable")}
            disabled={isSubmitting}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="billable" id="billable" />
              <Label htmlFor="billable" className="font-normal">Billable</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="non-billable" id="non-billable" />
              <Label htmlFor="non-billable" className="font-normal">Non-billable</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="mt-auto">
          <Button 
            type="submit" 
            className="w-full" 
            variant="form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Log Time'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}