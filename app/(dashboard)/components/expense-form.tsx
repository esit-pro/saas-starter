'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type ExpenseFormProps = {
  ticketId: number;
  onAddExpense: (expense: {
    ticketId: number;
    description: string;
    amount: number;
    category: string;
    billable: boolean;
    receiptUrl?: string;
  }) => void;
};

export function ExpenseForm({ ticketId, onAddExpense }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [billable, setBillable] = useState(true);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount.trim() || !category.trim()) return;
    
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, we'd upload the receipt file here and get a URL
      let receiptUrl = undefined;
      if (receiptFile) {
        // This would be an API call to upload the file
        receiptUrl = `/uploads/receipts/${ticketId}/${receiptFile.name}`;
      }
      
      onAddExpense({
        ticketId,
        description,
        amount: amountNumber,
        category,
        billable,
        receiptUrl
      });
      
      // Reset form
      setDescription('');
      setAmount('');
      setCategory('');
      setBillable(true);
      setReceiptFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('expense-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="expense-description">Description</Label>
        <Input
          id="expense-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the expense..."
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="expense-amount">Amount</Label>
          <Input
            id="expense-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="expense-category">Category</Label>
          <Input
            id="expense-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Hardware, Travel, etc."
            required
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="expense-file">Receipt (optional)</Label>
        <Input
          id="expense-file"
          type="file"
          className="cursor-pointer"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setReceiptFile(file);
          }}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="expense-billable"
          checked={billable}
          onCheckedChange={setBillable}
        />
        <Label htmlFor="expense-billable" className="font-normal">
          Billable to client
        </Label>
      </div>
      
      <Button type="submit" className="w-full" variant="form" disabled={isSubmitting}>
        {isSubmitting ? 'Adding Expense...' : 'Add Expense'}
      </Button>
    </form>
  );
}