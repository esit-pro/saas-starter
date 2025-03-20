'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardAction } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  }) => void;
};

export function TimeEntryForm({ ticketId, clientId, onLogTime }: TimeEntryFormProps) {
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [billable, setBillable] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || (!hours && !minutes)) return;
    
    const hoursNum = hours ? parseInt(hours, 10) : 0;
    const minutesNum = minutes ? parseInt(minutes, 10) : 0;
    const totalMinutes = hoursNum * 60 + minutesNum;
    
    if (totalMinutes <= 0) return;
    
    onLogTime({
      ticketId,
      clientId,
      description,
      startTime: new Date(),
      duration: totalMinutes,
      billable
    });
    
    // Reset form
    setDescription('');
    setHours('');
    setMinutes('');
    setBillable(true);
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
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label>Billing Type</Label>
          <RadioGroup defaultValue="billable" value={billable ? "billable" : "non-billable"} onValueChange={(val) => setBillable(val === "billable")}>
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
          <Button type="submit" className="w-full">
            Log Time
          </Button>
        </div>
      </div>
    </form>
  );
} 