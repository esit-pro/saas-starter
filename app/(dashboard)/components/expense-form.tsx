'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addExpense } from '@/app/(dashboard)/dashboard/tickets/actions';

type ExpenseFormProps = {
  ticketId: number;
  clientId?: number; // Optional clientId prop to pass to the API
  onAddExpense: (expense: {
    ticketId: number;
    description: string;
    amount: number;
    category: string;
    billable: boolean;
    receiptUrl?: string;
  }) => void;
};

export function ExpenseForm({ ticketId, clientId, onAddExpense }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [billable, setBillable] = useState(true);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount.trim() || !category.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, we'd upload the receipt file here and get a URL
      let receiptUrl = undefined;
      if (receiptFile) {
        // This would be an API call to upload the file
        receiptUrl = `/uploads/receipts/${ticketId}/${receiptFile.name}`;
      }
      
      // Prepare current date for the expense
      const date = new Date().toISOString();
      
      // Create form data
      const formData = new FormData();
      formData.append('ticketId', ticketId.toString());
      formData.append('clientId', clientId ? clientId.toString() : '1'); // Use provided clientId or default
      formData.append('description', description);
      formData.append('amount', amountNumber.toString());
      formData.append('category', category);
      formData.append('billable', billable.toString());
      formData.append('date', date);
      if (receiptUrl) {
        formData.append('receiptUrl', receiptUrl);
      }
      
      // Submit to server
      const result = await addExpense(
        {
          ticketId,
          clientId: clientId || 1, // Use provided clientId or default
          description,
          amount: amountNumber,
          category,
          billable,
          date,
          receiptUrl
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
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="expense-description">Description <span className="text-red-500">*</span></Label>
        <Input
          id="expense-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the expense..."
          required
          disabled={isSubmitting}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="expense-amount">Amount <span className="text-red-500">*</span></Label>
          <Input
            id="expense-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="expense-category">Category <span className="text-red-500">*</span></Label>
          <Input
            id="expense-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Hardware, Travel, etc."
            required
            disabled={isSubmitting}
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
          disabled={isSubmitting}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="expense-billable"
          checked={billable}
          onCheckedChange={setBillable}
          disabled={isSubmitting}
        />
        <Label htmlFor="expense-billable" className="font-normal">
          Billable to client
        </Label>
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        variant="form" 
        disabled={isSubmitting || !description.trim() || !amount || !category.trim()}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          'Add Expense'
        )}
      </Button>
    </form>
  );
}