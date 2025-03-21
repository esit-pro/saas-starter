"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TimeEntry = {
  id: number;
  description: string;
  client: {
    name: string;
  };
  user: {
    name: string;
  };
  clientId: number;
  duration: number;
  billed: boolean;
  billable: boolean;
  startTime: Date;
  endTime: Date | null;
};

const billingStatusColors = {
  'not-billable': 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  'unbilled': 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'billed': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
};

interface TimeLogsWidgetProps {
  teamId?: number;
}

export function TimeLogsWidget({ teamId }: TimeLogsWidgetProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimeEntries() {
      if (!teamId) return;
      
      try {
        const response = await fetch(`/api/time-entries?teamId=${teamId}&limit=4`);
        if (!response.ok) {
          throw new Error('Failed to fetch time entries');
        }
        const data = await response.json();
        setTimeEntries(data);
      } catch (error) {
        console.error('Error fetching time entries:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTimeEntries();
  }, [teamId]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Recent Time Logs</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/time" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              View all
              <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <div className="px-6">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : timeEntries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No time entries found</div>
          ) : (
            <ul className="divide-y divide-border">
              {timeEntries.map((entry) => (
                <li key={entry.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Link 
                          href={`/dashboard/time/${entry.id}`}
                          className="text-sm font-medium text-foreground hover:text-primary"
                        >
                          {entry.description}
                        </Link>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{entry.client.name}</span>
                        <span className="text-muted">•</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.startTime), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex flex-col gap-2 items-end">
                      <span className="text-sm font-medium">{Math.round(entry.duration / 60)}h</span>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                          ${!entry.billable 
                              ? billingStatusColors['not-billable'] 
                              : entry.billed 
                                ? billingStatusColors['billed'] 
                                : billingStatusColors['unbilled']
                          }`}
                      >
                        {!entry.billable 
                          ? 'Non-billable' 
                          : entry.billed 
                            ? 'Billed' 
                            : 'Billable'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 