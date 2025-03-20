'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

type Client = {
  id: number;
  name: string;
};

interface ClientComboboxProps {
  clients: Client[];
  selectedClientId: number | null;
  onClientChange: (clientId: number) => void;
  placeholder?: string;
}

export function ClientCombobox({
  clients,
  selectedClientId,
  onClientChange,
  placeholder = 'Select client...',
}: ClientComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter clients based on search query
  const filteredClients = searchQuery === '' 
    ? clients 
    : clients.filter((client) => 
        client.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Find the selected client
  const selectedClient = React.useMemo(() => 
    clients.find(client => client.id === selectedClientId), 
    [clients, selectedClientId]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls="client-list"
            className="flex w-full items-center justify-between rounded-md border border-input bg-transparent h-9 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {selectedClient ? selectedClient.name : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <div className="flex flex-col">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search client..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-8 w-full rounded-md bg-transparent border-0 py-1 text-sm outline-none focus-visible:outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div id="client-list" className="max-h-[300px] overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="py-6 text-center text-sm">No client found.</div>
            ) : (
              <div className="overflow-hidden p-1">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      selectedClientId === client.id && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => {
                      onClientChange(client.id);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClientId === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {client.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 