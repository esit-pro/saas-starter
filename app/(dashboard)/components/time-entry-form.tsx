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
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What work did you perform?"
            className="w-full"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="minutes">Minutes</Label>
            <Input
              id="minutes"
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <RadioGroup defaultValue="billable" value={billable ? "billable" : "non-billable"} onValueChange={(val) => setBillable(val === "billable")}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="billable" id="billable" />
            <Label htmlFor="billable">Billable</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="non-billable" id="non-billable" />
            <Label htmlFor="non-billable">Non-billable</Label>
          </div>
        </RadioGroup>
        
        <Button type="submit" className="w-full">
          Log Time
        </Button>
      </form>
    </Card>
  );
} 